
import Groq from 'groq-sdk';
import { embedText } from './embed';
import { cosineSimilarity } from './similarity';
import { Event, Task } from '../types';

// Initialize Groq SDK
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY || '';

// --------------------------------------------------------
// Types & Data Handling
// --------------------------------------------------------

export interface RagItem {
    id: string;
    type: 'event' | 'task';
    title: string;
    content: string; // Combined text representation
    date?: string;   // For context
    priority?: string;
    category?: string;
    original: Event | Task;
    embedding?: number[];
}

function normalizeData(events: Event[], tasks: Task[]): RagItem[] {
    const items: RagItem[] = [];

    // Process Events
    events.forEach(e => {
        const d = new Date(e.date);
        const timeString = e.isAllDay ? "All Day" : `${e.startTime}-${e.endTime}`;

        // Index BOTH short and long formats for maximum recall
        // e.g. "Monday Mon October Oct 15 2025"
        const fullDay = d.toLocaleDateString('en-US', { weekday: 'long' });
        const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
        const fullMonth = d.toLocaleDateString('en-US', { month: 'long' });
        const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
        const dayYear = d.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });

        const dateStr = `${fullDay} (${shortDay}), ${fullMonth} (${shortMonth}) ${dayYear}`;

        const text = `Event: ${e.title}. Category: ${e.category}. Priority: ${e.priority}. Date: ${dateStr} ${timeString}. Details: ${e.description || 'None'}`;
        items.push({
            id: `evt-${e.id}`,
            type: 'event',
            title: e.title,
            content: text,
            date: d.toISOString(),
            priority: e.priority, // Ensure these are passed
            category: e.category,
            original: e
        });
    });

    // Process Tasks
    tasks.forEach(t => {
        let dateStr = 'No Due Date';
        if (t.dueDate) {
            const d = new Date(t.dueDate);
            const fullDay = d.toLocaleDateString('en-US', { weekday: 'long' });
            const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
            const fullMonth = d.toLocaleDateString('en-US', { month: 'long' });
            const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
            const dayYear = d.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });
            dateStr = `${fullDay} (${shortDay}), ${fullMonth} (${shortMonth}) ${dayYear}`;
        }

        const text = `Task: ${t.title}. Category: ${t.category}. Priority: ${t.priority}. Due: ${dateStr}. Status: ${t.completed ? 'Done' : 'Pending'}. Details: ${t.description || 'None'}`;
        items.push({
            id: `tsk-${t.id}`,
            type: 'task',
            title: t.title,
            content: text,
            date: t.dueDate ? new Date(t.dueDate).toISOString() : undefined,
            priority: t.priority,
            category: t.category,
            original: t
        });
    });

    return items;
}

// --------------------------------------------------------
// Helper: Levenshtein Distance
// --------------------------------------------------------
const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
    }
    return matrix[b.length][a.length];
};

// --------------------------------------------------------
// Main Pipeline: ragQuery
// --------------------------------------------------------

export async function ragQuery(
    question: string,
    events: Event[],
    tasks: Task[]
): Promise<string> {
    if (!GROQ_KEY) return "Please configure your VITE_GROQ_KEY to use Mr. Crock AI.";
    if (!question || typeof question !== 'string') return "I didn't quite catch that. Could you say it again?";

    // Simple Chit-Chat Check
    const lowerQ = question.toLowerCase().trim();
    if (["hi", "hello", "hey", "hola", "yo"].includes(lowerQ.replace(/[^\w]/g, ''))) {
        return "Hello there! I'm Mr. Crock, your advanced Klyo assistant. How can I help with your schedule today?";
    }

    // 0. Prepare Data
    const items = normalizeData(events, tasks);
    if (items.length === 0) return "I don't see any events or tasks in your schedule yet.";

    // --- 0.5 SMART EXPANDER ---
    // Expand query logic inline or helper
    let searchQueries = [question];
    try {
        const expanded = await expandQueryLogic(question);
        searchQueries = [...searchQueries, ...expanded];
    } catch (e) {
        console.warn("Expansion failed", e);
    }

    // --- 1. HYBRID RETRIEVAL ---
    // Generate embeddings (using the newly pasted simplified embed.ts)
    // Since embedText is synchronous now (based on user paste), we can map directly
    const queryEmbeds = searchQueries.map(q => embedText(q));

    items.forEach(item => {
        if (!item.embedding) {
            item.embedding = embedText(item.content);
        }
    });

    // Prepare keywords
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'and', 'or', 'is', 'are', 'was', 'were']);
    const allQueryTerms = new Set<string>();
    searchQueries.forEach(q => {
        q.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w)).forEach(w => allQueryTerms.add(w));
    });
    const queryTerms = Array.from(allQueryTerms);

    // Score Items
    let ranked = items.map(item => {
        // A. Vector Score
        const vectorScore = Math.max(...queryEmbeds.map(qEmb => cosineSimilarity(qEmb, item.embedding || [])));

        // B. Lexical Score
        let lexicalScore = 0;
        const contentLower = item.content.toLowerCase();
        queryTerms.forEach(term => {
            if (contentLower.includes(term)) lexicalScore += 1.0;
        });

        // C. Title Boost
        if (queryTerms.some(term => item.title.toLowerCase().includes(term))) {
            lexicalScore += 2.0;
        }

        // D. Recency (Dates close to today get a boost if query implies time)
        let recencyScore = 0;
        if (item.date) {
            const daysDiff = Math.abs((new Date(item.date).getTime() - Date.now()) / (1000 * 3600 * 24));
            if (daysDiff < 7) recencyScore = 1.0; // Coming up or just happened
        }

        return { item, score: (vectorScore * 10) + lexicalScore + recencyScore };
    }).sort((a, b) => b.score - a.score);

    // --- 2. ORACLE RERANKER ---
    let candidates = ranked.slice(0, 15).map(r => r.item);

    // If we have candidates, let the LLM pick the best ones
    if (candidates.length > 0) {
        try {
            const reranked = await rerankItems(question, candidates);
            const rerankedIds = new Set(reranked.map(r => r.id));
            const others = candidates.filter(c => !rerankedIds.has(c.id));
            candidates = [...reranked, ...others];
        } catch (e) {
            console.warn("Rerank failed", e);
        }
    }

    // --- 2.5 STRICT FILTERING FOR DATES ("TODAY", "MONTH") ---
    const today = new Date();
    const isAskingToday = /\b(today|tonight)\b/i.test(question);

    // Detect Month mentions (e.g., "August", "in Aug", "this month")
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    // Check against the valid lowerQ defined at the start of the function
    let targetMonthIndex = -1;

    if (lowerQ.includes("this month")) {
        targetMonthIndex = today.getMonth();
    } else {
        // Check for specific month names
        targetMonthIndex = months.findIndex(m => lowerQ.includes(m));
        if (targetMonthIndex === -1) {
            targetMonthIndex = shortMonths.findIndex(m => lowerQ.includes(m));
        }
    }

    if (isAskingToday) {
        const todayStr = today.toISOString().split('T')[0];
        candidates = candidates.filter(c => c.date && c.date.startsWith(todayStr));
    } else if (targetMonthIndex !== -1) {
        // Filter by month
        candidates = candidates.filter(c => {
            if (!c.date) return false;
            const d = new Date(c.date);
            return d.getMonth() === targetMonthIndex;
        });
    }

    const totalFound = candidates.length;

    // --- 3. GENERATION ---
    // Increased limit to 50 to handle "count" questions better without pagination
    const topCandidates = candidates.slice(0, 50);

    const contextString = topCandidates.length > 0
        ? topCandidates.map(c => `- ${c.content}`).join("\n")
        : "No events found matching the specific date criteria.";

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `You are Mr. Crock (Klyo Edition).
                        You are an intelligent calendar assistant.
                        
                        Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        
                        Context (Events/Tasks):
                        ${contextString}
                        
                        Instructions:
                        1. Answer the user's question purely based on the context.
                        2. ALWAYS provide the following details for every event found:
                           - Category
                           - Priority
                           - Date
                           - Time (or "All Day")
                        3. If multiple events match, list them clearly using bullet points.
                        4. DATE AWARENESS:
                           - If user says "TODAY" or "THIS WEEK", STRICTLY compare event dates with Current Date.
                           - Do NOT show events from previous months unless explicitly asked.
                           - If user says "THIS MONTH", show only events from ${new Date().toLocaleDateString('en-US', { month: 'long' })}.
                        5. Be concise and friendly.`
                    },
                    {
                        role: "user",
                        content: `Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
                        
                        System Note: The user might be asking for a count. I have strictly filtered the database and found exactly ${totalFound} matching events/tasks for this query.
                        
                        Question: ${question}`
                    }
                ]
            })
        });

        const data = await res.json();
        const answer = data?.choices?.[0]?.message?.content;

        if (!answer) throw new Error("No answer from AI");

        // --- 4. REFLECTION CORE (Self-Correction) ---
        // Only run for complex queries/answers
        if (answer.length > 100 || question.length > 20) {
            const improvedAnswer = await reflectionStep(question, answer, contextString);
            if (improvedAnswer) return improvedAnswer;
        }

        return answer;

    } catch (e: any) {
        console.error("Groq Failure:", e);
        return `Error: ${e.message || "AI Service Failed"}. Check console.`;
    }
}

// --------------------------------------------------------
// Helper: API Functions
// --------------------------------------------------------

async function expandQueryLogic(query: string): Promise<string[]> {
    if (!GROQ_KEY) return [];
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a Query Expander. Goal: Decode abbreviations (e.g., 'tmrw' -> 'tomorrow', 'mtg' -> 'meeting') and fix typos. Generate 3 full-text search variations. Output JSON: {queries: string[]}." },
                    { role: "user", content: query }
                ],
                response_format: { type: "json_object" }
            })
        });
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return parsed.queries || [];
    } catch (e) { return []; }
}

async function rerankItems(query: string, items: RagItem[]): Promise<RagItem[]> {
    if (!GROQ_KEY) return items;
    const text = items.map((item, i) => `[${i}] ${item.content}`).join("\n");
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Return indices of most relevant items. Output JSON: {relevant_indices: number[]}. IGNORE irrelevant." },
                    { role: "user", content: `Query: ${query}\nItems:\n${text}` }
                ],
                response_format: { type: "json_object" }
            })
        });
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return parsed.relevant_indices.map((i: number) => items[i]).filter(Boolean);
    } catch (e) { return []; }
}

async function reflectionStep(query: string, answer: string, context: string): Promise<string | null> {
    if (!GROQ_KEY) return null;
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Rate answer 0-100 and critique. JSON: {score: number, critique: string}." },
                    { role: "user", content: `Question: ${query}\nContext: ${context}\nAnswer: ${answer}` }
                ],
                response_format: { type: "json_object" }
            })
        });
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);

        if (parsed.score < 80) {
            // Rewrite
            const rwRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: `Rewrite based on critique: ${parsed.critique}. Use Context.` },
                        { role: "user", content: `Context: ${context}\nQuestion: ${query}` }
                    ]
                })
            });
            const rwData = await rwRes.json();
            return rwData.choices[0].message.content;
        }
        return null;
    } catch (e) { return null; }
}
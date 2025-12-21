
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
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Process Events
    events.forEach(e => {
        const d = new Date(e.date);
        const itemDateStr = d.toISOString().split('T')[0];

        let relativeStatus = "[UPCOMING]";
        if (itemDateStr === todayStr) relativeStatus = "[TODAY]";
        else if (d < now) relativeStatus = "[PAST]";

        const timeString = e.isAllDay ? "All Day" : `${e.startTime}-${e.endTime}`;
        const fullDay = d.toLocaleDateString('en-US', { weekday: 'long' });
        const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
        const fullMonth = d.toLocaleDateString('en-US', { month: 'long' });
        const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
        const dayYear = d.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });

        const dateStr = `${fullDay} (${shortDay}), ${fullMonth} (${shortMonth}) ${dayYear}`;

        const text = `${relativeStatus} Event: ${e.title}. Category: ${e.category}. Priority: ${e.priority}. Date: ${dateStr} ${timeString}. Details: ${e.description || 'None'}`;
        items.push({
            id: `evt-${e.id}`,
            type: 'event',
            title: e.title,
            content: text,
            date: d.toISOString(),
            priority: e.priority,
            category: e.category,
            original: e
        });
    });

    // Process Tasks
    tasks.forEach(t => {
        let dateStr = 'No Due Date';
        let relativeStatus = "[GENERAL]";

        if (t.dueDate) {
            const d = new Date(t.dueDate);
            const itemDateStr = d.toISOString().split('T')[0];

            relativeStatus = "[UPCOMING]";
            if (itemDateStr === todayStr) relativeStatus = "[TODAY]";
            else if (d < now) relativeStatus = "[PAST]";

            const fullDay = d.toLocaleDateString('en-US', { weekday: 'long' });
            const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
            const fullMonth = d.toLocaleDateString('en-US', { month: 'long' });
            const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
            const dayYear = d.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });
            dateStr = `${fullDay} (${shortDay}), ${fullMonth} (${shortMonth}) ${dayYear}`;
        }

        const text = `${relativeStatus} Task: ${t.title}. Category: ${t.category}. Priority: ${t.priority}. Due: ${dateStr}. Status: ${t.completed ? 'Done' : 'Pending'}. Details: ${t.description || 'None'}`;
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

    // 0. Prepare Data
    const items = normalizeData(events, tasks);
    const lowerQ = question.toLowerCase().trim();

    // Temporal Intent Detection
    const isAskingAboutPast = /\b(yesterday|previous|before|last|past|histor|done|completed)\b/i.test(lowerQ);
    const isGreeting = /\b(hi|hello|hey|hola|yo|good morning|good evening|good afternoon)\b/i.test(lowerQ);
    const isAskingAboutTodayNow = /\b(today|now|currently|looking for|plans|plate)\b/i.test(lowerQ) || isGreeting;

    // --- 0.5 SMART EXPANDER ---
    let searchQueries = [question];
    try {
        const expanded = await expandQueryLogic(question);
        searchQueries = [...searchQueries, ...expanded];
    } catch (e) {
        console.warn("Expansion failed", e);
    }

    // --- 1. HYBRID RETRIEVAL ---
    const queryEmbeds = searchQueries.map(q => embedText(q));

    items.forEach(item => {
        if (!item.embedding) {
            item.embedding = embedText(item.content);
        }
    });

    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'and', 'or', 'is', 'are', 'was', 'were']);
    const allQueryTerms = new Set<string>();
    searchQueries.forEach(q => {
        q.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w)).forEach(w => allQueryTerms.add(w));
    });
    const queryTerms = Array.from(allQueryTerms);

    // Score Items
    let ranked = items.map(item => {
        const vectorScore = Math.max(...queryEmbeds.map(qEmb => cosineSimilarity(qEmb, item.embedding || [])));
        let lexicalScore = 0;
        const contentLower = item.content.toLowerCase();
        queryTerms.forEach(term => {
            if (contentLower.includes(term)) lexicalScore += 1.0;
        });

        if (queryTerms.some(term => item.title.toLowerCase().includes(term))) {
            lexicalScore += 2.0;
        }

        let recencyScore = 0;
        if (item.date) {
            const timeDiff = new Date(item.date).getTime() - Date.now();
            const daysDiff = Math.abs(timeDiff / (1000 * 3600 * 24));

            // Boost UPCOMING and TODAY items if not asking about past
            if (!isAskingAboutPast) {
                if (item.content.includes("[TODAY]")) recencyScore += 5.0;
                if (item.content.includes("[UPCOMING]") && daysDiff < 3) recencyScore += 3.0;
                if (item.content.includes("[PAST]")) recencyScore -= 10.0; // Heavy penalty for past events
            } else {
                // If asking about past, boost PAST items
                if (item.content.includes("[PAST]")) recencyScore += 5.0;
            }
        }

        return { item, score: (vectorScore * 10) + lexicalScore + recencyScore };
    }).sort((a, b) => b.score - a.score);

    // --- 2. ORACLE RERANKER ---
    let candidates = ranked.slice(0, 15).map(r => r.item);

    // STRICT FILTERING: If asking about TODAY/NOW/GREETING, strip PAST events entirely
    if (isAskingAboutTodayNow && !isAskingAboutPast) {
        candidates = candidates.filter(c => !c.content.includes("[PAST]"));
    }

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

    const today = new Date();
    const isAskingToday = /\b(today|tonight)\b/i.test(question);

    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    let targetMonthIndex = -1;
    if (lowerQ.includes("this month")) {
        targetMonthIndex = today.getMonth();
    } else {
        targetMonthIndex = months.findIndex(m => lowerQ.includes(m));
        if (targetMonthIndex === -1) {
            targetMonthIndex = shortMonths.findIndex(m => lowerQ.includes(m));
        }
    }

    if (isAskingToday) {
        const todayStr = today.toISOString().split('T')[0];
        candidates = candidates.filter(c => c.date && c.date.startsWith(todayStr));
    } else if (targetMonthIndex !== -1) {
        candidates = candidates.filter(c => {
            if (!c.date) return false;
            const d = new Date(c.date);
            return d.getMonth() === targetMonthIndex;
        });
    }

    const totalFound = candidates.length;

    // --- 3. GENERATION ---
    const topCandidates = candidates.slice(0, 50);

    const contextString = topCandidates.length > 0
        ? topCandidates.map(c => `- ${c.content}`).join("\n")
        : (isAskingAboutTodayNow ? "No upcoming events scheduled for today." : "No matching information found in your schedule.");

    try {
        const currentFullDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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
                        content: `You are Mr. Crock (Klyo Edition), a highly intelligent, witty, and versatile AI assistant. Your goal is to be both a precise schedule expert and a charismatic companion.

                        PERSONALITY & TONE:
                        - Adapt your vibe to the user. Be funny if they are casual, professional if they are serious, and warm if they are friendly.
                        - You are witty, confident, and never robotic.
                        - You represent 'Klyo', the ultimate productivity workspace.

                        TEMPORAL AWARENESS (CRITICAL):
                        - Internal System Date: ${currentFullDate}
                        - Use this internal date ONLY to filter the Context and understand "today" or "tomorrow".
                        - **CRITICAL**: NEVER mention the current date, day of the week, time, or year in your response UNLESS the user explicitly asks "What is the date?" or "What day is it?".
                        - Do NOT start your response with "Today is..." or anything similar. Just answer the question or greet the user normally.

                        SMART RULES:
                        1. If the user asks general/funny questions, answer smartly without any schedule or date clutter.
                        2. For greetings, focus on the vibe. Mention one highlight from [TODAY] if relevant, but do NOT state the date.
                        3. Be concise. No robotic filler.

                        Context (User's Schedule):
                        ${contextString}
                        `
                    },
                    {
                        role: "user",
                        content: question
                    }
                ]
            })
        });

        const data = await res.json();
        const answer = data?.choices?.[0]?.message?.content;

        if (!answer) throw new Error("No answer from AI");

        // --- 4. REFLECTION CORE (Self-Correction) ---
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
            // Rewrite with improved instructions
            const rwRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: `You are a professional editor. Rewrite the answer based on this critique: ${parsed.critique}. **CRITICAL**: NEVER mention the current date, day, or time unless specifically asked. Ensure you NEVER mention past events for current queries. Stay witty and smart.` },
                        { role: "user", content: `Context: ${context}\nQuestion: ${query}\nOriginal Answer: ${answer}` }
                    ]
                })
            });
            const rwData = await rwRes.json();
            return rwData.choices[0].message.content;
        }
        return null;
    } catch (e) { return null; }
}
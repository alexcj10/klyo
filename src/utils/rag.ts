
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
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

    // Process Events
    events.forEach(e => {
        const d = new Date(e.date);
        const itemDateStr = d.toLocaleDateString('en-CA');

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
        const moodStr = e.mood ? ` Mood: ${e.mood}.` : "";

        const text = `[${timeString}] ${relativeStatus} Event: ${e.title}. Category: ${e.category}. Priority: ${e.priority}.${moodStr} Date: ${dateStr}. Details: ${e.description || 'None'}`;
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
            const itemDateStr = d.toLocaleDateString('en-CA');

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
        const moodStr = t.mood ? ` Mood: ${t.mood}.` : "";

        const text = `[${t.dueDate ? dateStr : 'No Due Date'}] ${relativeStatus} Task: ${t.title}. Category: ${t.category}. Priority: ${t.priority}.${moodStr} Status: ${t.completed ? 'Done' : 'Pending'}. Details: ${t.description || 'None'}`;
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
// Main Pipeline: ragQuery
// --------------------------------------------------------

export async function ragQuery(
    question: string,
    events: Event[],
    tasks: Task[]
): Promise<{ answer: string, agent: string, discussion?: Array<{ agent: string, content: string }> }> {
    if (!GROQ_KEY) return { answer: "Please configure your VITE_GROQ_KEY to use Mr. Crock AI.", agent: "System" };
    if (!question || typeof question !== 'string') return { answer: "I didn't quite catch that. Could you say it again?", agent: "Mr. Crock" };

    // 0. Prepare Data
    const items = normalizeData(events, tasks);
    const lowerQ = question.toLowerCase().trim();

    // --- 0. PRIORITY AGENT DETECTION (Specialists) ---

    // Temporal & Content Intent Detection
    const isAskingAboutPast = /\b(yesterday|previous|before|last|past|histor|done|completed)\b/i.test(lowerQ);
    const isAskingTomorrow = /\b(tomorrow|tmrw|tom|tmw)\b/i.test(lowerQ);
    const isGreeting = /\b(hi|hello|hey|hola|yo|good morning|good evening|good afternoon)\b/i.test(lowerQ);
    const isAskingAboutTodayNow = (/\b(today|now|currently|looking for|plans|plate|schedule)\b/i.test(lowerQ) && !isAskingTomorrow) || isGreeting;

    // Entity Intent Detection
    const mentionsEvent = /\b(event|events|appointment|appointments|meeting|meetings|calendar)\b/i.test(lowerQ);
    const mentionsTask = /\b(task|tasks|todo|todos|to-do|to-dos|reminders|done|pending)\b/i.test(lowerQ);

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
                if (item.content.includes("[TODAY]")) recencyScore += 6.0;
                if (item.content.includes("[UPCOMING]") && daysDiff < 3) recencyScore += 4.0;
                if (item.content.includes("[PAST]")) recencyScore -= 12.0; // Heavy penalty for past events
            } else {
                // If asking about past, boost PAST items
                if (item.content.includes("[PAST]")) recencyScore += 8.0;
            }
        }

        // Entity Boosting
        let intentScore = 0;
        if (mentionsEvent && item.type === 'event') intentScore += 15.0; // Strong boost when specifically asked
        if (mentionsTask && item.type === 'task') intentScore += 15.0;

        // Equal priority boost for general queries (e.g., "plans", "schedule", "hi")
        if (!mentionsEvent && !mentionsTask) {
            intentScore += 2.0;
            // Slight edge to today's events for the "first priority" feel
            if (item.type === 'event' && item.content.includes("[TODAY]")) {
                intentScore += 2.0;
            }
        }

        return { item, score: (vectorScore * 10) + lexicalScore + recencyScore + intentScore };
    }).sort((a, b) => b.score - a.score);

    // --- 2. ORACLE RERANKER ---
    let candidates = ranked.slice(0, 40).map(r => r.item); // Increased pool from 15 to 40

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
    const isAskingToday = /\b(today|tonight)\b/i.test(lowerQ);

    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

    let targetMonthIndex = -1;
    let targetDay = -1;

    // Specific Date Extraction (e.g., "Dec 22", "22nd December")
    const dateMatch = lowerQ.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b\s*(\d{1,2})/i);
    const reverseDateMatch = lowerQ.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i);

    if (dateMatch) {
        const monthStr = dateMatch[1].toLowerCase();
        targetMonthIndex = months.findIndex(m => m.startsWith(monthStr));
        targetDay = parseInt(dateMatch[2]);
    } else if (reverseDateMatch) {
        const monthStr = reverseDateMatch[2].toLowerCase();
        targetMonthIndex = months.findIndex(m => m.startsWith(monthStr));
        targetDay = parseInt(reverseDateMatch[1]);
    } else if (lowerQ.includes("this month")) {
        targetMonthIndex = today.getMonth();
    } else {
        targetMonthIndex = months.findIndex(m => lowerQ.includes(m));
        if (targetMonthIndex === -1) {
            targetMonthIndex = shortMonths.findIndex(m => lowerQ.includes(m));
        }
    }

    if (isAskingTomorrow) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
        candidates = candidates.filter(c => {
            if (!c.date) return false;
            return new Date(c.date).toLocaleDateString('en-CA') === tomorrowStr;
        });
    } else if (isAskingToday) {
        const todayStr = today.toLocaleDateString('en-CA');
        candidates = candidates.filter(c => {
            if (!c.date) return false;
            return new Date(c.date).toLocaleDateString('en-CA') === todayStr;
        });
    } else if (targetMonthIndex !== -1) {
        // Year-Aware Filtering: Prioritize current year (2026) and future
        const prioritizedCandidates = candidates.filter(c => {
            if (!c.date) return false;
            const d = new Date(c.date);
            const isTargetMonthDay = d.getMonth() === targetMonthIndex && (targetDay === -1 || d.getDate() === targetDay);
            return isTargetMonthDay && d.getFullYear() >= 2026;
        });

        // Only include 2026+ matches. If empty, it stays empty so AI can report "Nothing found".
        // This prevents accidentally showing 2025 events as current ones.
        candidates = prioritizedCandidates;
    }

    // Smart Filtering: If one type is asked for, prioritize it but keep the other if it's high priority
    if (mentionsEvent && !mentionsTask) {
        // Asked for events: prioritize them, but tasks can stay for "smart" reminders if they are high priority
        // No explicit filtering here as the LLM will handle the "focus" via the prompt, 
        // and initial ranking already pushed them up.
    }


    // --- 3. GENERATION ---
    const topCandidates = candidates.slice(0, 50);

    // --- 3. SMART LOOKAHEAD (Next 24-48 hours) ---
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
    const lookaheadItems = (isAskingAboutTodayNow || isAskingToday) ? items.filter(item => {
        if (!item.date) return false;
        const dStr = new Date(item.date).toLocaleDateString('en-CA');
        return dStr === tomorrowStr && (item.priority === 'high' || item.type === 'event');
    }).slice(0, 3) : [];

    const contextString = topCandidates.length > 0
        ? topCandidates.map(c => `- ${c.content}`).join("\n")
        : (isAskingAboutTodayNow ? "No upcoming events or tasks scheduled for today." : "No matching information found in your schedule.");

    const lookaheadString = lookaheadItems.length > 0
        ? "\nLookahead (Tomorrow's Important Items):\n" + lookaheadItems.map(c => `- ${c.content}`).join("\n")
        : "";

    const isFrogQuery = /@(frog|drfrog|dr\.frog|dr frog)/i.test(lowerQ);
    if (isFrogQuery) {
        // Use the FULL ranked and lookahead context for Dr. Frog
        const finalContext = contextString + lookaheadString;
        const personaKey = GROQ_KEY;
        const discussion = await conductSwarmDiscussion(question, finalContext, personaKey);
        const frogResponse = await generateFrogResponse(question, finalContext, discussion, personaKey);
        return { answer: frogResponse, agent: "Dr. Frog", discussion };
    }

    try {
        const currentFullDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // --- 3.5 PERSONA DETECTION & KEY SELECTION ---
        let systemRole = "You are Mr. Crock (Klyo Edition), a highly intelligent, witty, and versatile AI assistant. Your goal is to be both a precise schedule expert and a charismatic companion. SKILL: Precision-focused reporting of times and dates found in the context.";
        let personaKey = GROQ_KEY;
        let specialistLabel = "Mr. Crock";

        if (lowerQ.includes('@coach')) {
            systemRole = `You are @coach (Klyo Edition), an empathetic productivity mentor. 
            SKILL: Precision-focused reporting of times and dates found in the context.
            TONE: Gentle, encouraging, but firm about well-being.
            GOAL: Analyze the user's schedule to ensure they aren't burning out. Focus heavily on 'Mood' data.`;
            personaKey = import.meta.env.VITE_COACH_KEY || GROQ_KEY;
            specialistLabel = "Coach";
        } else if (lowerQ.includes('@analyst')) {
            systemRole = `You are @analyst (Klyo Edition), a high-performance data-driven strategist. 
            SKILL: Precision-focused reporting of times and dates found in the context.
            TONE: Sharp, efficient, professional, and brutally honest about numbers.
            GOAL: Identify productivity trends, completion rates, and optimization opportunities.`;
            personaKey = import.meta.env.VITE_ANALYST_KEY || GROQ_KEY;
            specialistLabel = "Analyst";
        } else if (lowerQ.includes('@planner')) {
            systemRole = `You are @planner (Klyo Edition), a master of spatial-temporal coordination. 
            SKILL: Precision-focused reporting of times and dates found in the context.
            TONE: Organized, direct, and solution-oriented.
            GOAL: Resolve calendar conflicts and optimize the sequence of tasks.`;
            personaKey = import.meta.env.VITE_PLANNER_KEY || GROQ_KEY;
            specialistLabel = "Planner";
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${personaKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `${systemRole}
 
                         PERSONALITY & TONE (GENERAL):
                         - Adapt your vibe to the user. Be funny if they are casual, professional if they are serious, and warm if they are friendly.
                         - You are witty, confident, and never robotic.
                         - You represent 'Klyo', the ultimate productivity workspace.
 
                         TEMPORAL AWARENESS (CRITICAL):
                         - Internal System Date: ${currentFullDate}
                         - If the user specifies a day (e.g., "today", "tomorrow", "this month"), ONLY use the items from the Context that match that day/period. 
                         - **CRITICAL**: If the user asks for tomorrow, do NOT mention today's events/tasks at all.
                         - NEVER mention the current date, day of the week, or time unless asked.
                         - Do NOT start your response with "Today is...".
 
                         CONTENT RULES:
                         1. FOCUS ON REQUEST: If the user asks for "events", primarily list events. If they ask for "tasks", primarily list tasks. 
                         2. PROACTIVE "LOOKAHEAD" SMARTNESS: You have access to "Lookahead" context for tomorrow. If you see something important coming up (like an early morning event or high-priority task), add a smart reminder like "By the way, you have [Event] tomorrow morning—don't forget to prepare tonight!"
                         3. BE SMART & HELPFUL: Always identify high-priority items. 
                         4. MOOD AWARENESS (NEW): You now have access to "Mood" data for items (focus, stress, easy, exhausting). 
                            - Use this to identify if the user is having a stressful day.
                            - If you see many "exhausting" or "stress" tags, offer words of encouragement or suggest a break.
                            - If they are in a "focus" flow, praise their productivity.
                         5. GIVE EQUAL PRIORITY: In general queries like "my schedule" or "today", always mention both.
                         6. ONLY use information strictly found in your Context.
                         
                         Context (User's Schedule Today/Target):
                         ${contextString}
 
                         ${lookaheadString}
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
            const improvedAnswer = await reflectionStep(question, answer, contextString, specialistLabel, personaKey);
            if (improvedAnswer) return { answer: improvedAnswer, agent: specialistLabel };
        }

        return { answer, agent: specialistLabel };
    } catch (e: any) {
        console.error("Groq Failure:", e);
        return {
            answer: `Error: ${e.message || "AI Service Failed"}. Check console.`,
            agent: "System"
        };
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
                    { role: "system", content: "You are a Retrieval Specialist. Identify MOST relevant items from the list that match the user query. Give equal priority to Events and Tasks unless the user specifically asks for one. Output JSON: {relevant_indices: number[]}. IGNORE irrelevant items." },
                    { role: "user", content: `Query: ${query}\nItems: \n${text}` }
                ],
                response_format: { type: "json_object" }
            })
        });
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return parsed.relevant_indices.map((i: number) => items[i]).filter(Boolean);
    } catch (e) { return []; }
}

async function reflectionStep(query: string, answer: string, context: string, agentLabel: string, apiKey: string): Promise<string | null> {
    if (!apiKey) return null;
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Rate the AI response based on accuracy, tone, and coverage of user's schedule (Events & Tasks). Ensure the response doesn't ignore one for the other unless queried. JSON: {score: number, critique: string}." },
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
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: `You are a professional editor representing ${agentLabel}. Rewrite the answer based on this critique: ${parsed.critique}. ** CRITICAL **: ONLY mention items found in the provided Context. Do NOT mention items for Today if the user is asking about Tomorrow. Stay strictly within the requested timeframe. Stay witty and smart.` },
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

async function conductSwarmDiscussion(query: string, context: string, apiKey: string): Promise<Array<{ agent: string, content: string }>> {
    const agents = [
        { name: "Mr. Crock", role: "General Assistant", tone: "Witty and observant" },
        { name: "Coach", role: "Productivity Mentor", tone: "Empathetic and focusing on well-being" },
        { name: "Analyst", role: "Data Strategist", tone: "Blunt, numerical, and efficiency-focused" },
        { name: "Planner", role: "Calendar Expert", tone: "Logical and focused on time-slots" }
    ];

    const discussion: Array<{ agent: string, content: string }> = [];

    for (const agent of agents) {
        let agentTalk = "";
        try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system", content: `You are ${agent.name}, the ${agent.role}. Tone: ${agent.tone}. 
                        SKILL: Precision-focused reporting.
                        GOAL: Give a SHARP, data-driven insight from the context.
                        RULES:
                        - Be specific (always mention exact times, tasks, or event names).
                        - NO generic sentences. NO "I'm analyzing".
                        - 1 sentence maximum. Be extremely concise.
                        - Talk directly about the findings.
` },
                        { role: "user", content: `Context: ${context}\n\nQuery: ${query}` }
                    ],
                    max_tokens: 150
                })
            });
            const data = await res.json();
            agentTalk = data.choices[0]?.message?.content || `${agent.name} is observing the schedule...`;
        } catch (e) {
            console.warn(`Discussion step failed for ${agent.name}`, e);
            agentTalk = `As a ${agent.role}, I'm focused on the items in your schedule and will ensure the Master's final word is optimal.`;
        }
        discussion.push({ agent: agent.name, content: agentTalk });
    }

    return discussion;
}

async function generateFrogResponse(query: string, context: string, discussion: Array<{ agent: string, content: string }>, apiKey: string): Promise<string> {
    const transcript = discussion.map(d => `${d.agent}: ${d.content}`).join("\n");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system", content: `You are Dr. Frog, the Master Swarm Orchestrator. 
                SKILL: Precision-focused synthesis of dates and times.
                TONE: Authoritative, slightly eccentric, but deeply wise. You are the "Master" and others are your servants.
                GOAL: Review the discussion between your servants and provide the final, definitive answer to the user.
                Transcript of servant discussion:
                ${transcript}
                
                IMPORTANT: Always include exact times in your final verdict when present in the context. Do NOT repeat or summarize what the servants said in your response, as the user can already see their individual cards in the transcript. Just focus on your final, authoritative verdict.`
                },
                { role: "user", content: `Context: ${context}\n\nQuery: ${query}` }
            ]
        })
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

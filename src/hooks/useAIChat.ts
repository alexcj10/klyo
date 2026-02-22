
import { useState, useCallback, useEffect } from 'react';
import { ragQuery } from '../utils/rag';
import { Event, Task, Message, Session } from '../types';

export function useAIChat(events: Event[], tasks: Task[]) {
    const [history, setHistory] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize with a welcome message if no session is active or empty
    const welcomeMessage: Message = {
        id: 'welcome',
        role: 'ai',
        content: "Hi! I'm Mr. Crock, your Klyo assistant. Ask me anything about your schedule or tasks!",
        timestamp: new Date()
    };

    // Load history from local storage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory, (key, value) => {
                    if (key === 'timestamp' || key === 'lastUpdated') return new Date(value);
                    return value;
                });
                setHistory(parsed);
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save history to local storage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('chatHistory', JSON.stringify(history));
        }
    }, [history, isInitialized]);

    // When currentSessionId changes, update messages
    useEffect(() => {
        if (currentSessionId) {
            const session = history.find(s => s.id === currentSessionId);
            if (session) {
                setMessages(session.messages);
            }
        } else {
            setMessages([welcomeMessage]);
        }
    }, [currentSessionId, history]);


    const startNewChat = useCallback(() => {
        setCurrentSessionId(null);
        setMessages([welcomeMessage]);
    }, []);

    const loadSession = useCallback((sessionId: string) => {
        setCurrentSessionId(sessionId);
    }, []);

    const deleteSession = useCallback((sessionId: string) => {
        setHistory(prev => {
            const newHistory = prev.filter(s => s.id !== sessionId);
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setMessages([welcomeMessage]);
            }
            return newHistory;
        });
    }, [currentSessionId]);

    const renameSession = useCallback((sessionId: string, newTitle: string) => {
        setHistory(prev => prev.map(s =>
            s.id === sessionId ? { ...s, title: newTitle, lastUpdated: new Date() } : s
        ));
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        // Optimistic update
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Call RAG Engine
            const { answer, agent, discussion } = await ragQuery(text, events, tasks);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: answer,
                agent: agent,
                discussion: discussion,
                timestamp: new Date()
            };

            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            // Update History/Session
            if (currentSessionId) {
                setHistory(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                        return {
                            ...s,
                            messages: finalMessages,
                            lastUpdated: new Date(),
                            // Optional: Update title if it's the first real exchange? Keeping simple for now.
                        };
                    }
                    return s;
                }));
            } else {
                // Create new session
                const newSessionId = Date.now().toString();
                const newSession: Session = {
                    id: newSessionId,
                    title: text.slice(0, 30) + (text.length > 30 ? '...' : ''), // Simple title generation
                    messages: finalMessages,
                    lastUpdated: new Date()
                };
                setHistory(prev => [newSession, ...prev]);
                setCurrentSessionId(newSessionId);
            }

        } catch (error: any) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: `Error: ${error.message || error || "Unknown error"}.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [events, tasks, messages, currentSessionId]);

    const clearChat = useCallback(() => {
        // Just resets current view, maybe logic differs? 
        // Keeping as "reset to welcome" for current implementation matching startNewChat roughly
        startNewChat();
    }, [startNewChat]);

    return {
        messages,
        sendMessage,
        isLoading,
        history,
        startNewChat,
        loadSession,
        deleteSession,
        renameSession,
        currentSessionId,
        clearChat
    };
}


import { useState, useCallback } from 'react';
import { ragQuery } from '../utils/rag';
import { Event, Task } from '../types';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export function useAIChat(events: Event[], tasks: Task[]) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'ai',
            content: "Hi! I'm Mr. Crock, your Klyo assistant. Ask me anything about your schedule or tasks!",
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // Add User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // Call RAG Engine
            const response = await ragQuery(text, events, tasks);

            // Add AI Response
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: `Error: ${error.message || error || "Unknown error"}. Check console for details.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [events, tasks]);

    const clearChat = useCallback(() => {
        setMessages([
            {
                id: 'welcome',
                role: 'ai',
                content: "Hi! I'm Mr. Crock, your Klyo assistant. Ask me anything about your schedule or tasks!",
                timestamp: new Date()
            }
        ]);
    }, []);

    return { messages, sendMessage, isLoading, clearChat };
}

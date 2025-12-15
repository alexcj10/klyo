
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, MessageSquare, Trash2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIChat } from '../hooks/useAIChat';
import { Event, Task } from '../types';
import crockLogo from '../assets/crock.png';

interface AIChatProps {
    events: Event[];
    tasks: Task[];
}

export default function AIChat({ events, tasks }: AIChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const { messages, sendMessage, isLoading, clearChat } = useAIChat(events, tasks);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-6 right-6 w-[calc(100vw-48px)] sm:w-96 h-[60vh] sm:h-[500px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 flex flex-col z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
                            <div className="flex items-center gap-3">
                                <div className="drop-shadow-md">
                                    <img src={crockLogo} alt="Mr. Crock" className="w-10 h-10 rounded-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Mr. Crock</h3>
                                    <p className="text-xs text-white/80">Klyo Assistant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                                    title="Clear Chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-violet-600 text-white rounded-tr-sm'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                                            }`}
                                    >
                                        {msg.role === 'ai' && (
                                            <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-violet-600/80">
                                                <img src={crockLogo} className="w-4 h-4 rounded-full object-cover" /> Mr. Crock
                                            </div>
                                        )}
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex gap-1">
                                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask about your schedule..."
                                    className="w-full bg-slate-100 text-slate-800 placeholder:text-slate-500 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="absolute right-2 p-2 bg-violet-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors shadow-sm"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Request Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 !bg-transparent p-0 border-none outline-none cursor-pointer transition-transform hover:scale-110 active:scale-95"
                >
                    <img
                        src={crockLogo}
                        alt="Chat with Mr. Crock"
                        className="w-[44px] h-[44px] sm:w-14 sm:h-14 object-contain drop-shadow-xl"
                    />
                </motion.button>
            )}
        </>
    );
}

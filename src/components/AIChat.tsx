
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, X, MessageSquare, History, Plus, Edit2, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIChat } from '../hooks/useAIChat';
import { Event, Task, Session } from '../types';
import crockLogo from '../assets/crock.png';
import { format } from 'date-fns';

interface AIChatProps {
    events: Event[];
    tasks: Task[];
    isSidebarOpen?: boolean;
}

export default function AIChat({ events, tasks, isSidebarOpen }: AIChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [inputValue, setInputValue] = useState('');

    // Rename state
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

    const {
        messages,
        sendMessage,
        isLoading,
        history,
        startNewChat,
        loadSession,
        deleteSession,
        renameSession,
        currentSessionId
    } = useAIChat(events, tasks);

    const chatRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!showHistory && isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, showHistory]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setEditingSessionId(null);
                startNewChat(); // Reset on close
            }
        }

        if (isOpen) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.overscrollBehavior = 'none';
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
        };
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleNewChat = () => {
        startNewChat();
        setShowHistory(false);
        setInputValue('');
        setTimeout(scrollToBottom, 100);
    };

    const handleLoadSession = (sessionId: string) => {
        loadSession(sessionId);
        setShowHistory(false);
        setTimeout(scrollToBottom, 100);
    };

    const startEditing = (e: React.MouseEvent, sessionId: string, currentTitle: string) => {
        e.stopPropagation();
        setEditingSessionId(sessionId);
        setEditTitle(currentTitle);
    };

    const saveTitle = (e: React.MouseEvent | React.FormEvent, sessionId: string) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            renameSession(sessionId, editTitle.trim());
        }
        setEditingSessionId(null);
    };

    const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setDeletingSessionId(sessionId);
    };

    const confirmDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        deleteSession(sessionId);
        setDeletingSessionId(null);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingSessionId(null);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={chatRef}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed z-50 flex flex-col overflow-hidden bg-white/95 backdrop-blur-md shadow-2xl border border-white/50 transition-all duration-300 ease-out bottom-6 left-6 right-6 h-[70vh] rounded-[2rem] sm:left-auto sm:right-6 sm:bottom-6 sm:rounded-2xl sm:w-[450px] sm:h-[75vh] md:h-[80vh]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="drop-shadow-md">
                                    <img src={crockLogo} alt="Mr. Crock" className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-sm truncate">Mr. Crock</h3>
                                    <p className="text-xs text-white/80 truncate">Klyo Assistant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleNewChat}
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white"
                                    title="New Chat"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`p-1.5 rounded-lg transition-colors text-white/90 hover:text-white ${showHistory ? 'bg-white/20' : 'hover:bg-white/20'}`}
                                    title="History"
                                >
                                    <History className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        startNewChat();
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50/50">
                            <AnimatePresence mode="wait">
                                {showHistory ? (
                                    <motion.div
                                        key="history"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="absolute inset-0 overflow-y-auto p-2 sm:p-3"
                                    >
                                        <div className="space-y-2">
                                            {history.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full pt-20 text-gray-400">
                                                    <History className="w-12 h-12 mb-2 opacity-50" />
                                                    <p className="text-sm">No chat history yet</p>
                                                </div>
                                            ) : (
                                                history.map((session: Session) => (
                                                    <div
                                                        key={session.id}
                                                        onClick={() => handleLoadSession(session.id)}
                                                        className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${currentSessionId === session.id
                                                            ? 'bg-violet-50 border-violet-200 shadow-sm'
                                                            : 'bg-white border-gray-100 hover:border-violet-100 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${currentSessionId === session.id ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'}`}>
                                                            <MessageSquare className="w-4 h-4" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            {editingSessionId === session.id ? (
                                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        type="text"
                                                                        value={editTitle}
                                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                                        className="flex-1 text-sm px-2 py-1 rounded border border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                                                        autoFocus
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') saveTitle(e, session.id);
                                                                            if (e.key === 'Escape') setEditingSessionId(null);
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={(e) => saveTitle(e, session.id)}
                                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="font-medium text-sm text-gray-700 truncate pr-2" title={session.title}>
                                                                            {session.title}
                                                                        </h4>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {format(new Date(session.lastUpdated), 'MMM d, h:mm a')}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>

                                                        {editingSessionId !== session.id && (
                                                            <div className="flex items-center gap-1 transition-opacity">
                                                                {deletingSessionId === session.id ? (
                                                                    <div className="flex items-center gap-1 bg-red-50 rounded-lg p-0.5" onClick={e => e.stopPropagation()}>
                                                                        <button
                                                                            onClick={(e) => confirmDelete(e, session.id)}
                                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                                            title="Confirm Delete"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={cancelDelete}
                                                                            className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                                                                            title="Cancel"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => startEditing(e, session.id, session.title)}
                                                                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                                            title="Rename"
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => handleDeleteClick(e, session.id)}
                                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                ) : ( // Chat View
                                    <motion.div
                                        key="chat"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex flex-col h-full overflow-hidden"
                                    >
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
                                            {messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] p-3 sm:p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                                            ? 'bg-violet-600 text-white rounded-tr-sm'
                                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                                                            }`}
                                                    >
                                                        {msg.role === 'ai' && (
                                                            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-violet-600/90 tracking-wide border-b border-violet-100 pb-1">
                                                                <img src={crockLogo} className="w-3 h-3 rounded-full object-cover" />
                                                                Mr. Crock
                                                            </div>
                                                        )}
                                                        <div className="markdown-body">
                                                            <ReactMarkdown
                                                                components={{
                                                                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                                                                    ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 space-y-1 my-2" {...props} />,
                                                                    ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 space-y-1 my-2" {...props} />,
                                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-3 mb-2" {...props} />,
                                                                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2 mb-1" {...props} />,
                                                                    code: ({ node, className, children, ...props }: any) => {
                                                                        const match = /language-(\w+)/.exec(className || '');
                                                                        return match ? (
                                                                            <code className="block bg-gray-100 p-2 rounded-lg my-2 text-xs font-mono overflow-x-auto" {...props}>
                                                                                {children}
                                                                            </code>
                                                                        ) : (
                                                                            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-violet-600" {...props}>
                                                                                {children}
                                                                            </code>
                                                                        )
                                                                    }
                                                                }}
                                                            >
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {isLoading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex gap-1.5">
                                                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Input */}
                                        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 z-10">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="text"
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    placeholder="Ask about your schedule..."
                                                    className="w-full bg-slate-50 text-slate-800 placeholder:text-slate-500 rounded-xl pl-4 pr-12 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:bg-white transition-all border border-slate-200 focus:border-violet-300"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!inputValue.trim() || isLoading}
                                                    className="absolute right-2 p-2 bg-violet-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors shadow-sm active:scale-95"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Request Button */}
            <AnimatePresence>
                {!isOpen && !isSidebarOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 !bg-transparent p-0 border-none outline-none cursor-pointer"
                    >
                        <img
                            src={crockLogo}
                            alt="Chat with Mr. Crock"
                            className="w-[44px] h-[44px] sm:w-14 sm:h-14 object-contain drop-shadow-xl"
                        />
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
}


import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, X, MessageSquare, History, Plus, Edit2, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIChat } from '../hooks/useAIChat';
import { Event, Task, Session } from '../types';
import crockLogo from '../assets/crock.png';
import frogLogo from '../assets/frog.png';
import { format } from 'date-fns';

interface AIChatProps {
    events: Event[];
    tasks: Task[];
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function AIChat({ events, tasks, isOpen = false, setIsOpen = () => { } }: AIChatProps) {
    const [showHistory, setShowHistory] = useState(false);
    const [inputValue, setInputValue] = useState('');

    // Rename state
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

    // Mention state
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);

    // Sticky agent state: null = default Crock
    const [activeAgent, setActiveAgent] = useState<typeof AGENTS[0] | null>(null);

    const AGENTS = [
        { id: 'frog', label: '@frog', detail: 'Master Swarm Orchestrator (Elite)', color: 'text-emerald-600', bg: 'hover:bg-emerald-50', icon: '🐸' },
        { id: 'crock', label: '@crock', detail: 'Default Klyo Assistant', color: 'text-blue-600', bg: 'hover:bg-blue-50', icon: '🤖' },
        { id: 'coach', label: '@coach', detail: 'Productivity Mentor', color: 'text-teal-600', bg: 'hover:bg-teal-50', icon: '🌱' },
        { id: 'analyst', label: '@analyst', detail: 'Data Strategist', color: 'text-purple-600', bg: 'hover:bg-purple-50', icon: '📊' },
        { id: 'planner', label: '@planner', detail: 'Calendar Expert', color: 'text-orange-600', bg: 'hover:bg-orange-50', icon: '📅' },
    ];

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
        if (!isOpen) {
            setShowHistory(false);
            setEditingSessionId(null);
            setDeletingSessionId(null);
            setInputValue('');
            setShowMentionPopup(false);
            setActiveAgent(null); // Reset agent on close
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.overscrollBehavior = 'none';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
        };
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        let msgToSend = inputValue;
        const hasExplicitMention = /@(frog|drfrog|coach|analyst|planner|crock)/i.test(inputValue);

        // If an agent is active but this message doesn't mention one, auto-prepend
        if (activeAgent && activeAgent.id !== 'crock' && !hasExplicitMention) {
            msgToSend = `${activeAgent.label}/ ${inputValue}`;
        }

        // Detect if a new agent mention switches the active agent
        const agentMatch = inputValue.match(/@(frog|drfrog|coach|analyst|planner|crock)/i);
        if (agentMatch) {
            const mentionedId = agentMatch[1].toLowerCase().replace('drfrog', 'frog');
            if (mentionedId === 'crock') {
                setActiveAgent(null); // Reset to default
            } else {
                const found = AGENTS.find(a => a.id === mentionedId);
                if (found) setActiveAgent(found);
            }
        }

        sendMessage(msgToSend);
        setInputValue('');
        setShowMentionPopup(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const cursorPos = e.target.selectionStart;
        setInputValue(val);

        // Basic mention detection
        const lastAt = val.lastIndexOf('@', cursorPos - 1);
        if (lastAt !== -1 && (lastAt === 0 || val[lastAt - 1] === ' ' || val[lastAt - 1] === '\n')) {
            const search = val.slice(lastAt + 1, cursorPos);
            if (!search.includes(' ') && !search.includes('/')) {
                setMentionSearch(search);
                setShowMentionPopup(true);
                setMentionIndex(0);
                return;
            }
        }
        setShowMentionPopup(false);
    };

    const selectAgent = (agent: typeof AGENTS[0]) => {
        const cursorPos = textareaRef.current?.selectionStart || 0;
        const lastAt = inputValue.lastIndexOf('@', cursorPos - 1);

        const before = inputValue.slice(0, lastAt);
        const after = inputValue.slice(cursorPos);

        const newValue = `${before}${agent.label}/${after}`;
        setInputValue(newValue);
        setShowMentionPopup(false);
        setActiveAgent(agent); // Sticky: lock to this agent

        // Focus and set cursor
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = before.length + agent.label.length + 1;
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 10);
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                            onClick={() => {
                                setIsOpen(false);
                                setEditingSessionId(null);
                                setShowMentionPopup(false);
                                startNewChat();
                            }}
                        />
                        <motion.div
                            ref={chatRef}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="fixed z-[70] flex flex-col overflow-hidden bg-white/95 backdrop-blur-md shadow-2xl border border-white/50 transition-all duration-300 ease-out bottom-6 left-6 right-6 h-[70vh] rounded-[2rem] sm:left-auto sm:right-6 sm:bottom-6 sm:rounded-2xl sm:w-[450px] sm:h-[75vh] md:h-[80vh]"
                        >
                            {/* Header - dynamic based on active agent */}
                            <div className={`p-4 border-b border-gray-100 flex justify-between items-center text-white shadow-sm z-10 transition-all duration-500 ${activeAgent?.id === 'frog' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' :
                                activeAgent?.id === 'coach' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                                    activeAgent?.id === 'analyst' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                        activeAgent?.id === 'planner' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                            'bg-gradient-to-r from-blue-500 to-blue-600'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className="drop-shadow-md">
                                        {activeAgent?.id === 'frog' ? (
                                            <img src={frogLogo} alt="Dr. Frog" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
                                        ) : (
                                            <img src={crockLogo} alt="Mr. Crock" className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-sm truncate">
                                            {activeAgent ? (
                                                activeAgent.id === 'frog' ? 'Dr. Frog' :
                                                    activeAgent.id === 'coach' ? 'Coach' :
                                                        activeAgent.id === 'analyst' ? 'Analyst' :
                                                            activeAgent.id === 'planner' ? 'Planner' : 'Mr. Crock'
                                            ) : 'Mr. Crock'}
                                        </h3>
                                        <p className="text-xs text-white/80 truncate">
                                            {activeAgent ? activeAgent.detail : 'Klyo Assistant'}
                                        </p>
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
                                            setShowMentionPopup(false);
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
                                                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                                : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-md'
                                                                }`}
                                                        >
                                                            <div className={`p-2 rounded-lg ${currentSessionId === session.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                <MessageSquare className="w-4 h-4" />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                {editingSessionId === session.id ? (
                                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                        <input
                                                                            type="text"
                                                                            value={editTitle}
                                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                                            className="flex-1 text-sm px-2 py-1 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                                            <div
                                                className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain"
                                                onClick={() => setShowMentionPopup(false)}
                                            >
                                                {messages.map((msg) => (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[85%] p-3 sm:p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                                                                }`}
                                                        >
                                                            {msg.role === 'ai' && (
                                                                <div className={`flex items-center gap-2 mb-1.5 text-xs font-bold tracking-wide border-b pb-1 ${msg.agent === 'Coach' ? 'text-emerald-600 border-emerald-100' :
                                                                    msg.agent === 'Analyst' ? 'text-purple-600 border-purple-100' :
                                                                        msg.agent === 'Planner' ? 'text-orange-600 border-orange-100' :
                                                                            msg.agent === 'Dr. Frog' ? 'text-emerald-700 border-emerald-200 bg-emerald-50/50 -mx-1 px-1 rounded-t' :
                                                                                'text-blue-600/90 border-blue-100'
                                                                    }`}>
                                                                    {msg.agent === 'Dr. Frog' ? (
                                                                        <img src={frogLogo} className="w-6 h-6 rounded-full object-cover border border-emerald-300 shadow-sm" />
                                                                    ) : (
                                                                        <img src={crockLogo} className="w-6 h-6 rounded-full object-cover border border-blue-200 shadow-sm" />
                                                                    )}
                                                                    {msg.agent || 'Mr. Crock'}
                                                                </div>
                                                            )}

                                                            {/* Swarm Discussion Transcript */}
                                                            {msg.discussion && msg.discussion.length > 0 && (
                                                                <div className="mb-4 space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                                                                        Agent Swarm Insight
                                                                    </div>
                                                                    <motion.div
                                                                        className="space-y-2"
                                                                        initial="hidden"
                                                                        animate="visible"
                                                                        variants={{
                                                                            visible: { transition: { staggerChildren: 0.8 } }
                                                                        }}
                                                                    >
                                                                        {msg.discussion.map((step, i) => (
                                                                            <motion.div
                                                                                key={i}
                                                                                variants={{
                                                                                    hidden: { opacity: 0, x: -10 },
                                                                                    visible: { opacity: 1, x: 0 }
                                                                                }}
                                                                                className={`p-2 rounded-lg border text-[11px] leading-relaxed relative ${step.agent === 'Coach' ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' :
                                                                                    step.agent === 'Analyst' ? 'bg-purple-50/30 border-purple-100 shadow-sm' :
                                                                                        step.agent === 'Planner' ? 'bg-orange-50/30 border-orange-100 shadow-sm' :
                                                                                            'bg-blue-50/30 border-blue-100 shadow-sm'
                                                                                    }`}
                                                                            >
                                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                                    <div className={`w-2 h-2 rounded-sm rotate-45 ${step.agent === 'Coach' ? 'bg-emerald-500' :
                                                                                        step.agent === 'Analyst' ? 'bg-purple-500' :
                                                                                            step.agent === 'Planner' ? 'bg-orange-500' :
                                                                                                'bg-blue-500'
                                                                                        }`} />
                                                                                    <span className={`font-black uppercase tracking-tighter text-[9px] ${step.agent === 'Coach' ? 'text-emerald-700' :
                                                                                        step.agent === 'Analyst' ? 'text-purple-700' :
                                                                                            step.agent === 'Planner' ? 'text-orange-700' :
                                                                                                'text-blue-700'
                                                                                        }`}>{step.agent}</span>
                                                                                </div>
                                                                                <span className="text-slate-600 block pl-3 border-l-2 border-slate-200 ml-1 italic leading-normal">"{step.content}"</span>
                                                                            </motion.div>
                                                                        ))}
                                                                    </motion.div>
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
                                                                                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-blue-600" {...props}>
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
                                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {/* Input */}
                                            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 z-10 relative">
                                                {/* Mention Popup */}
                                                <AnimatePresence>
                                                    {showMentionPopup && (() => {
                                                        // Smart filter: hide @crock when no agent active (default is already Crock),
                                                        // hide the currently active agent (can't switch to yourself),
                                                        // but show @crock when another agent is active (as an escape hatch)
                                                        const visibleAgents = AGENTS.filter(a => {
                                                            if (!activeAgent && a.id === 'crock') return false; // hide crock at start
                                                            if (activeAgent && a.id === activeAgent.id) return false; // hide current agent
                                                            const q = mentionSearch.toLowerCase();
                                                            return !q || a.id.includes(q) || a.label.includes(q);
                                                        });

                                                        return (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="absolute bottom-full left-2 right-2 mb-3 bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden z-[80]"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {/* Header */}
                                                                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Agent</span>
                                                                    </div>
                                                                    <span className="text-[9px] text-slate-400/60 font-medium">↑↓ navigate · Enter select</span>
                                                                </div>

                                                                {/* Agent List */}
                                                                <div className="p-1 space-y-0">
                                                                    {visibleAgents.map((agent, idx) => (
                                                                        <div
                                                                            key={agent.id}
                                                                            onClick={() => selectAgent(agent)}
                                                                            onMouseEnter={() => setMentionIndex(idx)}
                                                                            className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-150 ${mentionIndex === idx
                                                                                ? 'bg-slate-50/80'
                                                                                : 'hover:bg-slate-50/50'
                                                                                }`}
                                                                        >
                                                                            {/* Selected Accent Bar */}
                                                                            {mentionIndex === idx && (
                                                                                <motion.div
                                                                                    layoutId="mention-accent"
                                                                                    className={`absolute left-0 w-0.5 h-5 rounded-r-full ${agent.color.replace('text-', 'bg-')}`}
                                                                                />
                                                                            )}

                                                                            {/* Avatar */}
                                                                            <div className="relative flex-shrink-0">
                                                                                {agent.id === 'frog' ? (
                                                                                    <img src={frogLogo} className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                                                ) : agent.id === 'crock' ? (
                                                                                    <img src={crockLogo} className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                                                ) : (
                                                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] shadow-sm border border-slate-100 ${agent.id === 'coach' ? 'bg-teal-50' :
                                                                                        agent.id === 'analyst' ? 'bg-purple-50' :
                                                                                            'bg-orange-50'
                                                                                        }`}>{agent.icon}</div>
                                                                                )}
                                                                            </div>

                                                                            {/* Info */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={`font-bold text-[12px] leading-tight transition-colors ${mentionIndex === idx ? agent.color : 'text-slate-700'}`}>
                                                                                    {agent.label}
                                                                                </div>
                                                                                <div className="text-[9px] text-slate-400 mt-0.5 truncate font-medium">
                                                                                    {agent.detail}
                                                                                </div>
                                                                            </div>

                                                                            {/* Active Indicator (Dot) */}
                                                                            {mentionIndex === idx && (
                                                                                <div className={`w-1 h-1 rounded-full flex-shrink-0 opacity-40 ${agent.color.replace('text-', 'bg-')}`} />
                                                                            )}
                                                                        </div>
                                                                    ))}

                                                                    {visibleAgents.length === 0 && (
                                                                        <div className="py-6 text-center text-xs text-slate-400 font-medium">No agents found</div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })()}
                                                </AnimatePresence>



                                                <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:bg-white focus-within:border-blue-400/50 transition-all duration-200 shadow-sm overflow-hidden p-1">
                                                    <textarea
                                                        ref={textareaRef}
                                                        value={inputValue}
                                                        onChange={handleInputChange}
                                                        onKeyDown={(e) => {
                                                            if (showMentionPopup) {
                                                                const filtered = AGENTS.filter(a => a.label.toLowerCase().includes(mentionSearch.toLowerCase()));
                                                                if (e.key === 'ArrowDown') {
                                                                    e.preventDefault();
                                                                    setMentionIndex((prev) => (prev + 1) % filtered.length);
                                                                } else if (e.key === 'ArrowUp') {
                                                                    e.preventDefault();
                                                                    setMentionIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
                                                                } else if (e.key === 'Enter' || e.key === 'Tab') {
                                                                    e.preventDefault();
                                                                    if (filtered[mentionIndex]) selectAgent(filtered[mentionIndex]);
                                                                } else if (e.key === 'Escape') {
                                                                    setShowMentionPopup(false);
                                                                }
                                                                return;
                                                            }

                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSubmit(e);
                                                            }
                                                        }}
                                                        placeholder="Ask about your schedule..."
                                                        rows={1}
                                                        className="flex-1 bg-transparent text-slate-800 placeholder:text-slate-500 pl-4 pr-2 py-2 text-[15px] focus:outline-none resize-none min-h-[40px] max-h-32 overflow-y-auto custom-scrollbar leading-relaxed"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={!inputValue.trim() || isLoading}
                                                        className="flex-shrink-0 p-2 ml-1 mr-1 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm active:scale-95 z-10"
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
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Check,
  Trash2,
  X,
  ChevronRight,
  AlertCircle,
  Clock,
  Layout,
  Layers,
  Star,
  Type,
  AlignLeft,
  Tag,
  ListChecks
} from 'lucide-react';
import { KanbanTicket, KanbanStatus, KanbanPriority } from '../types';
import KanbanTicketModal from './KanbanTicketModal';

interface KanbanBoardProps {
  tickets: KanbanTicket[];
  onTicketAdd: (ticket: Omit<KanbanTicket, 'id' | 'createdAt'>) => void;
  onTicketUpdate: (ticketId: string, updates: Partial<KanbanTicket>) => void;
  onTicketDelete: (ticketId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tickets, 
  onTicketAdd, 
  onTicketUpdate, 
  onTicketDelete 
}) => {
  const [addingToColumn, setAddingToColumn] = useState<KanbanStatus | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineDescription, setInlineDescription] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Inline creator state
  const [inlinePriority, setInlinePriority] = useState<KanbanPriority>('medium');
  const [inlinePoints, setInlinePoints] = useState<number>(0);
  const [inlineLabels, setInlineLabels] = useState<string[]>([]);
  const [inlineSubtasks, setInlineSubtasks] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Standalone Kanban Columns
  const columns: { id: KanbanStatus; title: string; color: string; bgColor: string }[] = [
    { id: 'backlog', title: 'Backlog', color: 'bg-slate-500', bgColor: 'bg-slate-50/50' },
    { id: 'todo', title: 'To Do', color: 'bg-blue-600', bgColor: 'bg-blue-50/30' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-amber-600', bgColor: 'bg-amber-50/30' },
    { id: 'done', title: 'Done', color: 'bg-emerald-600', bgColor: 'bg-emerald-50/30' }
  ];

  const getPriorityInfo = (priority: KanbanPriority) => {
    switch (priority) {
      case 'urgent': return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-l-red-600', icon: AlertCircle, label: 'Urgent' };
      case 'high': return { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-l-orange-500', icon: Star, label: 'High' };
      case 'medium': return { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-l-blue-400', icon: Clock, label: 'Medium' };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-l-slate-300', icon: Layers, label: 'Low' };
    }
  };

  // Dynamic label color palette - each label gets a consistent unique color based on its name
  const labelColorPalette = [
    'bg-blue-50 text-blue-600 border-blue-200',
    'bg-emerald-50 text-emerald-600 border-emerald-200',
    'bg-purple-50 text-purple-600 border-purple-200',
    'bg-pink-50 text-pink-600 border-pink-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-indigo-50 text-indigo-600 border-indigo-200',
    'bg-rose-50 text-rose-600 border-rose-200',
    'bg-cyan-50 text-cyan-700 border-cyan-200',
    'bg-teal-50 text-teal-600 border-teal-200',
    'bg-violet-50 text-violet-600 border-violet-200',
    'bg-sky-50 text-sky-600 border-sky-200',
    'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
  ];

  const getLabelColor = (label: string) => {
    const hash = label.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
    return labelColorPalette[hash % labelColorPalette.length];
  };

  // Unique border color per ticket based on ticket ID
  const ticketBorderColors = [
    'border-l-blue-500',
    'border-l-emerald-500',
    'border-l-purple-500',
    'border-l-pink-500',
    'border-l-amber-500',
    'border-l-indigo-500',
    'border-l-rose-500',
    'border-l-cyan-500',
    'border-l-teal-500',
    'border-l-violet-500',
    'border-l-sky-500',
    'border-l-orange-500',
  ];

  const getTicketBorderColor = (ticketId: string) => {
    const hash = ticketId.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
    return ticketBorderColors[hash % ticketBorderColors.length];
  };

  const handleInlineSubmit = (status: KanbanStatus) => {
    if (inlineTitle.trim()) {
      onTicketAdd({
        title: inlineTitle.trim(),
        description: inlineDescription.trim() || undefined,
        status,
        priority: inlinePriority,
        storyPoints: inlinePoints > 0 ? inlinePoints : undefined,
        labels: inlineLabels,
        subtasks: inlineSubtasks.map(t => ({ id: Math.random().toString(), title: t, completed: false }))
      });
      setInlineTitle('');
      setInlineDescription('');
      setInlinePriority('medium');
      setInlinePoints(0);
      setInlineLabels([]);
      setInlineSubtasks([]);
      setNewLabelInput('');
      setNewSubtaskInput('');
      setAddingToColumn(null);
    }
  };

  const handleCancelInline = () => {
    setInlineTitle('');
    setInlineDescription('');
    setInlinePriority('medium');
    setInlinePoints(0);
    setInlineLabels([]);
    setInlineSubtasks([]);
    setNewLabelInput('');
    setNewSubtaskInput('');
    setAddingToColumn(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Kanban Header / Filter Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Board</h2>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md text-slate-500">
              {tickets.length}
            </span>
            <span className="bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md text-blue-500">
              {tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} pts
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto p-3 sm:p-5 gap-4 custom-scrollbar bg-slate-50/20 snap-x snap-mandatory scroll-smooth" onClick={() => setActiveMenu(null)}>
      {columns.map((column) => {
        const columnTickets = tickets.filter(t => t.status === column.id);

        return (
          <div key={column.id} className={`flex-1 min-w-[290px] sm:min-w-[320px] max-w-[420px] flex flex-col rounded-2xl ${column.bgColor} border border-slate-100 p-3 snap-center shadow-sm`}>
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1 group">
              <div className="flex items-center gap-2.5">
                <div className={`w-1.5 h-6 rounded-full ${column.color}`} />
                <div className="flex flex-col">
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                    {column.title}
                  </h3>
                  <span className="text-[9px] font-medium text-slate-400">
                    {columnTickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} story points
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full shadow-sm ml-1">
                  {columnTickets.length}
                </span>
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === column.id ? null : column.id); }}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition-all active:scale-90"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {activeMenu === column.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 py-1.5 overflow-hidden"
                    >
                       <button onClick={() => { handleCancelInline(); setAddingToColumn(column.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add New Ticket
                      </button>
                      <button className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-400 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                        <Layout className="w-3.5 h-3.5" /> Column Settings
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tickets List */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1.5 min-h-0 pb-4">
              <AnimatePresence mode="popLayout">
                {columnTickets.map((ticket) => {
                  const p = getPriorityInfo(ticket.priority);
                  const completedSubtasks = ticket.subtasks.filter(s => s.completed).length;
                  
                  return (
                    <motion.div
                      key={ticket.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      onClick={(e) => { e.stopPropagation(); setSelectedTicketId(ticket.id); }}
                      className={`group bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative border-l-[6px] cursor-pointer ${getTicketBorderColor(ticket.id)}`}
                    >
                      <div className="flex flex-col gap-3">
                        {/* Tags / Labels Row */}
                        {ticket.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ticket.labels.map(label => (
                              <span key={label} className={`text-[8px] font-bold px-2 py-0.5 rounded-md border ${getLabelColor(label)}`}>
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3 overflow-hidden">
                          <h4 className="text-[13px] font-bold text-slate-800 leading-tight break-all flex-1 tracking-tight">
                            {ticket.title}
                          </h4>
                          <button onClick={(e) => { e.stopPropagation(); onTicketDelete(ticket.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0 active:scale-90">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {ticket.description && (
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">
                            {ticket.description}
                          </p>
                        )}

                        {/* Subtasks Progress */}
                        {ticket.subtasks.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                              <span>Progress</span>
                              <span>{completedSubtasks}/{ticket.subtasks.length}</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${(completedSubtasks / ticket.subtasks.length) * 100}%` }}
                                className="h-full bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                              />
                            </div>
                          </div>
                        )}

                        {/* Bottom Row: Story Points + Priority + Move */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-3">
                            {ticket.storyPoints !== undefined && (
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg shadow-sm">
                                <span className="text-[10px] font-bold text-slate-700">{ticket.storyPoints}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-[9px] font-medium text-blue-400">pts</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-1 text-[9px] font-bold ${p.color}`}>
                              <p.icon className="w-3 h-3" />
                              {p.label}
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5">
                            {column.id !== 'backlog' && (
                              <button onClick={(e) => { e.stopPropagation(); onTicketUpdate(ticket.id, { status: columns[columns.findIndex(c => c.id === column.id) - 1].id }); }} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-blue-600 rotate-180 active:scale-75 transition-all">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                            {column.id !== 'done' && (
                              <button onClick={(e) => { e.stopPropagation(); onTicketUpdate(ticket.id, { status: columns[columns.findIndex(c => c.id === column.id) + 1].id }); }} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-blue-600 active:scale-75 transition-all">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* ===== REDESIGNED INLINE TICKET CREATOR ===== */}
              <AnimatePresence>
                {addingToColumn === column.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="bg-white rounded-2xl border-2 border-blue-400 shadow-xl shadow-blue-100/50"
                  >
                    {/* Header bar */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100/50 rounded-t-2xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${column.color} animate-pulse`} />
                        <span className="text-[10px] font-bold text-slate-500">
                          Adding to <span className="text-blue-600">{column.title}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={handleCancelInline} 
                          className="p-1 hover:bg-white/80 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleInlineSubmit(column.id)} 
                          disabled={!inlineTitle.trim()} 
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[10px] font-bold shadow-sm active:scale-95"
                        >
                          <Check className="w-3 h-3 stroke-[3px]" />
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="p-3 space-y-3">
                      {/* Title */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Type className="w-3 h-3" />
                            <span className="text-[9px] font-bold">Title</span>
                          </div>
                          <span className={`text-[9px] font-bold tabular-nums ${inlineTitle.length > 90 ? 'text-red-500' : 'text-slate-300'}`}>
                            {inlineTitle.length}/100
                          </span>
                        </div>
                        <textarea
                          autoFocus 
                          placeholder="What needs to be done?" 
                          value={inlineTitle} 
                          onChange={(e) => setInlineTitle(e.target.value.slice(0, 100))}
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInlineSubmit(column.id); } 
                            if (e.key === 'Escape') handleCancelInline(); 
                          }}
                          rows={1}
                          className="w-full text-sm font-semibold text-slate-800 placeholder-slate-300 bg-slate-50/50 rounded-lg border border-slate-100 focus:border-blue-200 focus:bg-white px-3 py-2 resize-none leading-snug outline-none focus:ring-2 focus:ring-blue-50 transition-all caret-blue-600"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <AlignLeft className="w-3 h-3" />
                          <span className="text-[9px] font-bold">Description</span>
                          <span className="text-[9px] font-medium text-slate-300">(optional)</span>
                        </div>
                        <textarea
                          placeholder="Add more details, context, or notes..." 
                          value={inlineDescription}
                          onChange={(e) => setInlineDescription(e.target.value)}
                          rows={2}
                          className="w-full text-xs font-medium text-slate-600 placeholder-slate-300 bg-slate-50/50 rounded-lg border border-slate-100 focus:border-blue-200 focus:bg-white px-3 py-2 resize-none leading-relaxed outline-none focus:ring-2 focus:ring-blue-50 transition-all max-h-[120px]"
                        />
                      </div>

                      {/* Priority + Points Row */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <select 
                          value={inlinePriority} 
                          onChange={(e) => setInlinePriority(e.target.value as KanbanPriority)}
                          className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-white hover:border-blue-200 transition-all outline-none focus:ring-2 focus:ring-blue-50 cursor-pointer"
                        >
                          <option value="low">🟢 Low</option>
                          <option value="medium">🔵 Medium</option>
                          <option value="high">🟠 High</option>
                          <option value="urgent">🔴 Urgent</option>
                        </select>
                        
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus-within:border-blue-200 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                          <Star className="w-3 h-3 text-amber-400" />
                          <input 
                            type="number" 
                            placeholder="Pts" 
                            min="0"
                            max="99"
                            value={inlinePoints || ''} 
                            onChange={(e) => setInlinePoints(parseInt(e.target.value) || 0)}
                            className="w-8 text-[10px] font-bold bg-transparent text-slate-600 outline-none placeholder-slate-400"
                          />
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Tag className="w-3 h-3" />
                          <span className="text-[9px] font-bold">Labels</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {inlineLabels.map(l => (
                            <motion.button 
                              key={l} 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              onClick={() => setInlineLabels(prev => prev.filter(x => x !== l))}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all group/label flex items-center gap-1 ${getLabelColor(l)}`}
                            >
                              {l}
                              <X className="w-2.5 h-2.5 opacity-0 group-hover/label:opacity-100 transition-opacity" />
                            </motion.button>
                          ))}
                          <form 
                            className="flex-1 flex flex-wrap gap-1.5 items-center"
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (newLabelInput.trim() && !inlineLabels.includes(newLabelInput.trim())) {
                                setInlineLabels([...inlineLabels, newLabelInput.trim()]); 
                              }
                              setNewLabelInput('');
                            }}
                          >
                            <input 
                              type="text" 
                              placeholder={inlineLabels.length > 0 ? "+ Add" : "+ Type label & Enter"} 
                              value={newLabelInput} 
                              onChange={(e) => setNewLabelInput(e.target.value)}
                              enterKeyHint="done"
                              className="min-w-[80px] flex-1 text-[10px] font-bold bg-slate-50/50 border border-dashed border-slate-200 rounded-lg px-2 py-1 text-slate-500 focus:bg-white focus:border-blue-300 outline-none transition-all placeholder-slate-300"
                            />
                          </form>
                        </div>
                      </div>

                      {/* Checklist */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <ListChecks className="w-3 h-3" />
                          <span className="text-[9px] font-bold">Checklist</span>
                          {inlineSubtasks.length > 0 && (
                            <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 rounded-md">{inlineSubtasks.length}</span>
                          )}
                        </div>

                        {inlineSubtasks.length > 0 && (
                          <div className="space-y-0.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                            {inlineSubtasks.map((st, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 group py-0.5 px-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                <div className="w-3.5 h-3.5 rounded border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
                                  <div className="w-1 h-1 rounded-sm bg-slate-300" />
                                </div>
                                <span className="text-[10px] font-medium text-slate-600 flex-1">{st}</span>
                                <button 
                                  onClick={() => setInlineSubtasks(prev => prev.filter((_, idx) => idx !== i))} 
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        <form 
                          className="flex-1 flex items-center gap-2 px-1.5"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newSubtaskInput.trim()) {
                              setInlineSubtasks([...inlineSubtasks, newSubtaskInput.trim()]); 
                            }
                            setNewSubtaskInput('');
                          }}
                        >
                          <div className="w-3.5 h-3.5 rounded border-2 border-dashed border-slate-200 flex items-center justify-center flex-shrink-0">
                            <Plus className="w-2 h-2 text-slate-300" />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Add checklist item & Enter" 
                            value={newSubtaskInput} 
                            onChange={(e) => setNewSubtaskInput(e.target.value)}
                            enterKeyHint="done"
                            className="flex-1 text-[10px] font-medium text-slate-600 placeholder-slate-300 bg-transparent outline-none"
                          />
                        </form>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!addingToColumn && (
                <button
                  onClick={() => { handleCancelInline(); setAddingToColumn(column.id); }}
                  className="w-full py-3 flex items-center justify-center gap-2 px-3 text-slate-400 hover:text-blue-600 hover:bg-white border-2 border-dashed border-slate-100 hover:border-blue-200 rounded-2xl transition-all text-xs font-bold group active:scale-[0.98] mt-1"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  New Ticket
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Ticket Detail Modal */}
      {selectedTicketId && tickets.find(t => t.id === selectedTicketId) && (
        <KanbanTicketModal 
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticket={tickets.find(t => t.id === selectedTicketId)!}
          onUpdate={(updates) => onTicketUpdate(selectedTicketId, updates)}
          onDelete={() => { onTicketDelete(selectedTicketId); setSelectedTicketId(null); }}
        />
      )}
    </div>
    </div>
  );
};

export default KanbanBoard;

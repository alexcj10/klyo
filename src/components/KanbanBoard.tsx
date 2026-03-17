import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Check,
  CheckCircle2,
  Trash2,
  X,
  ChevronRight,
  AlertCircle,
  Clock,
  Layout,
  Layers,
  Star
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
  const [selectedTicket, setSelectedTicket] = useState<KanbanTicket | null>(null);
  
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

  const getLabelColor = (label: string) => {
    const colors = [
      'bg-blue-50 text-blue-600 border-blue-100',
      'bg-emerald-50 text-emerald-600 border-emerald-100',
      'bg-purple-50 text-purple-600 border-purple-100',
      'bg-pink-50 text-pink-600 border-pink-100',
      'bg-amber-50 text-amber-600 border-amber-100',
      'bg-indigo-50 text-indigo-600 border-indigo-100',
      'bg-rose-50 text-rose-600 border-rose-100',
      'bg-cyan-50 text-cyan-600 border-cyan-100'
    ];
    // Simple hash to consistently pick a color for a label name
    const index = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Kanban Header / Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Project Board</h2>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-slate-600">
              {tickets.length} tickets
            </span>
            <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md text-blue-600">
              {tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} total points
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold transition-all border border-slate-200/50">
            FILTERS
           </button>
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
                  <span className="text-[9px] font-bold text-slate-400 tracking-tighter">
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
                       <button onClick={() => { setAddingToColumn(column.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
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
                      onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                      className={`group bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all relative border-l-[6px] cursor-pointer ${p.border}`}
                    >
                      <div className="flex flex-col gap-3">
                        {/* Tags / Labels Row */}
                        {ticket.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ticket.labels.map(label => (
                              <span key={label} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${getLabelColor(label) || 'bg-slate-100 text-slate-600'}`}>
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3 overflow-hidden">
                          <h4 className="text-[13px] font-bold text-slate-800 leading-tight break-all flex-1 tracking-tight">
                            {ticket.title}
                          </h4>
                          <button onClick={() => onTicketDelete(ticket.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 active:scale-90">
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
                            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <span>PROGRESS</span>
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
                                <span className="text-[10px] font-black text-slate-700">{ticket.storyPoints}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-[9px] font-bold text-slate-400 tracking-tighter">POINTS</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-1 text-[9px] font-black tracking-widest ${p.color}`}>
                              <p.icon className="w-3 h-3" />
                              {p.label}
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5">
                            {column.id !== 'backlog' && (
                              <button onClick={() => onTicketUpdate(ticket.id, { status: columns[columns.findIndex(c => c.id === column.id) - 1].id })} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-blue-600 rotate-180 active:scale-75 transition-all">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                            {column.id !== 'done' && (
                              <button onClick={() => onTicketUpdate(ticket.id, { status: columns[columns.findIndex(c => c.id === column.id) + 1].id })} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-blue-600 active:scale-75 transition-all">
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

              {/* Inline Ticket Editor */}
              <AnimatePresence>
                {addingToColumn === column.id && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl border-2 border-blue-500 p-3 shadow-2xl ring-4 ring-blue-50 relative z-20">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${inlineTitle.length > 90 ? 'text-red-500' : 'text-slate-300'}`}>Title ({inlineTitle.length}/100)</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setAddingToColumn(null)} className="p-1 hover:bg-slate-50 rounded text-slate-300 hover:text-red-400 transition-all"><X className="w-3.5 h-3.5" /></button>
                          <button 
                            onClick={() => handleInlineSubmit(column.id)} 
                            disabled={!inlineTitle.trim()} 
                            className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm active:scale-90"
                          >
                            <Check className="w-3 h-3 stroke-[3.5px]" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        autoFocus placeholder="What needs to be done?" value={inlineTitle} 
                        onChange={(e) => setInlineTitle(e.target.value.slice(0, 100))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInlineSubmit(column.id); } if (e.key === 'Escape') setAddingToColumn(null); }}
                        className="w-full text-sm font-bold text-slate-800 placeholder-slate-300 bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[32px] leading-relaxed outline-none caret-blue-600"
                      />
                      <textarea
                        placeholder="Add more details here..." value={inlineDescription}
                        onChange={(e) => setInlineDescription(e.target.value)}
                        className="w-full text-[11px] font-medium text-slate-500 placeholder-slate-200 bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[20px] max-h-[80px] leading-relaxed outline-none mt-0.5"
                      />
                    </div>
                    
                    {/* Inline Metadata Grid */}
                    <div className="space-y-2 border-t border-slate-50 pt-3 mt-1">
                      <div className="flex flex-wrap gap-2">
                         <select 
                          value={inlinePriority} onChange={(e) => setInlinePriority(e.target.value as KanbanPriority)}
                          className="text-[9px] font-bold bg-slate-50 border border-slate-100 rounded-md px-1.5 py-1 text-slate-500 hover:bg-white transition-all outline-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        
                        <input 
                          type="number" placeholder="Pts" value={inlinePoints || ''} onChange={(e) => setInlinePoints(parseInt(e.target.value) || 0)}
                          className="w-10 text-[9px] font-bold bg-slate-50 border border-slate-100 rounded-md px-1.5 py-1 text-slate-500 hover:bg-white transition-all outline-none"
                        />

                        {/* Inline Custom Labels */}
                        <div className="flex flex-wrap gap-1 items-center">
                          {inlineLabels.map(l => (
                            <button 
                              key={l} onClick={() => setInlineLabels(prev => prev.filter(x => x !== l))}
                              className={`text-[9px] font-bold px-1.5 py-1 rounded-md border hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all ${getLabelColor(l)}`}
                            >
                              {l}
                            </button>
                          ))}
                          <div className="flex items-center gap-1">
                            <input 
                              type="text" placeholder="+ Tag" value={newLabelInput} onChange={(e) => setNewLabelInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newLabelInput.trim() && !inlineLabels.includes(newLabelInput.trim())) setInlineLabels([...inlineLabels, newLabelInput.trim()]); setNewLabelInput(''); } }}
                              className="w-14 text-[9px] font-bold bg-slate-50/50 border border-dashed border-slate-200 rounded-md px-1.5 py-1 text-slate-400 focus:bg-white focus:border-blue-300 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Inline Subtasks List */}
                      {inlineSubtasks.length > 0 && (
                        <div className="space-y-1 pl-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                          {inlineSubtasks.map((st, i) => (
                            <div key={i} className="flex items-center gap-2 group">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-500 flex-1">{st}</span>
                              <button onClick={() => setInlineSubtasks(prev => prev.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-2.5 h-2.5 text-slate-400" /></div>
                        <input 
                          type="text" placeholder="Add checklist item..." value={newSubtaskInput} onChange={(e) => setNewSubtaskInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSubtaskInput.trim()) setInlineSubtasks([...inlineSubtasks, newSubtaskInput.trim()]); setNewSubtaskInput(''); } }}
                          className="flex-1 text-[10px] font-bold text-slate-600 placeholder-slate-300 bg-transparent border-none focus:ring-0 p-0 outline-none"
                        />
                      </div>
                    </div>

                    {/* Compact Action Footer Removed for Slimness - Buttons moved to top */}
                  </motion.div>
                )}
              </AnimatePresence>

              {!addingToColumn && (
                <button
                  onClick={() => setAddingToColumn(column.id)}
                  className="w-full py-3.5 flex items-center justify-center gap-2 px-3 text-slate-400 hover:text-blue-600 hover:bg-white border-2 border-dashed border-slate-100 hover:border-blue-100 rounded-2xl transition-all text-xs font-black group active:scale-[0.98] mt-1"
                >
                  <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
                  NEW TICKET
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <KanbanTicketModal 
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
          onUpdate={(updates) => onTicketUpdate(selectedTicket.id, updates)}
          onDelete={() => onTicketDelete(selectedTicket.id)}
        />
      )}
    </div>
    </div>
  );
};

export default KanbanBoard;

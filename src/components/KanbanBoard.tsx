import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Tag, 
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<KanbanTicket | null>(null);

  // Standalone Kanban Columns
  const columns: { id: KanbanStatus; title: string; color: string; bgColor: string }[] = [
    { id: 'backlog', title: 'BACKLOG', color: 'bg-slate-500', bgColor: 'bg-slate-50/50' },
    { id: 'todo', title: 'TO DO', color: 'bg-blue-600', bgColor: 'bg-blue-50/30' },
    { id: 'in-progress', title: 'IN PROGRESS', color: 'bg-amber-600', bgColor: 'bg-amber-50/30' },
    { id: 'done', title: 'DONE', color: 'bg-emerald-600', bgColor: 'bg-emerald-50/30' }
  ];

  const getPriorityInfo = (priority: KanbanPriority) => {
    switch (priority) {
      case 'urgent': return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-l-red-600', icon: AlertCircle, label: 'URGENT' };
      case 'high': return { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-l-orange-500', icon: Star, label: 'HIGH' };
      case 'medium': return { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-l-blue-400', icon: Clock, label: 'MEDIUM' };
      default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-l-slate-300', icon: Layers, label: 'LOW' };
    }
  };

  const labelColors: Record<string, string> = {
    'Design': 'bg-pink-100 text-pink-700',
    'UI/UX': 'bg-purple-100 text-purple-700',
    'Backend': 'bg-blue-100 text-blue-700',
    'Bug': 'bg-red-100 text-red-700',
    'Feature': 'bg-emerald-100 text-emerald-700',
    'Refactor': 'bg-amber-100 text-amber-700',
    'API': 'bg-indigo-100 text-indigo-700',
  };

  const handleInlineSubmit = (status: KanbanStatus) => {
    if (inlineTitle.trim()) {
      onTicketAdd({
        title: inlineTitle.trim(),
        status,
        priority: 'medium',
        labels: [],
        subtasks: []
      });
      setInlineTitle('');
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
            <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">Project Board</h2>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-slate-600">
              {tickets.length} TICKETS
            </span>
            <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md text-blue-600">
              {tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} TOTAL POINTS
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
                  <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase">
                    {column.title}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
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
                       <button onClick={() => { setAddingToColumn(column.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5">
                        <Plus className="w-3.5 h-3.5" /> ADD NEW TICKET
                      </button>
                      <button className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-400 hover:bg-slate-50 flex items-center gap-2.5 transition-colors">
                        <Layout className="w-3.5 h-3.5" /> COLUMN SETTINGS
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
                              <span key={label} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${labelColors[label] || 'bg-slate-100 text-slate-600'}`}>
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
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl border-2 border-blue-500 p-3 shadow-2xl ring-4 ring-blue-50">
                    <textarea
                      autoFocus placeholder="Feature name or bug description..." value={inlineTitle} onChange={(e) => setInlineTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInlineSubmit(column.id); } if (e.key === 'Escape') setAddingToColumn(null); }}
                      className="w-full text-xs font-bold text-slate-800 placeholder-slate-300 bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[50px] leading-relaxed"
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                      <div className="flex gap-1">
                        <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center"><Tag className="w-3 h-3 text-slate-400" /></div>
                        <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-slate-400" /></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setAddingToColumn(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
                        <button onClick={() => handleInlineSubmit(column.id)} disabled={!inlineTitle.trim()} className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-black rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 active:scale-90">
                          CREATE
                        </button>
                      </div>
                    </div>
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

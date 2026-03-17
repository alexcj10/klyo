import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Trash2, 
  Plus, 
  Maximize2
} from 'lucide-react';
import { KanbanTicket, KanbanPriority } from '../types';

interface KanbanTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: KanbanTicket;
  onUpdate: (updates: Partial<KanbanTicket>) => void;
  onDelete: () => void;
}

const KanbanTicketModal: React.FC<KanbanTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onUpdate,
  onDelete
}) => {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description || '');
  const [priority, setPriority] = useState<KanbanPriority>(ticket.priority);
  const [storyPoints, setStoryPoints] = useState(ticket.storyPoints || 0);
  const [newSubtask, setNewSubtask] = useState('');
  const [labels, setLabels] = useState<string[]>(ticket.labels);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');

  useEffect(() => {
    setTitle(ticket.title);
    setDescription(ticket.description || '');
    setPriority(ticket.priority);
    setStoryPoints(ticket.storyPoints || 0);
    setLabels(ticket.labels);
  }, [ticket]);

  const saveChanges = () => {
    onUpdate({
      title,
      description,
      priority,
      storyPoints: storyPoints > 0 ? storyPoints : undefined,
      labels
    });
  };

  const toggleSubtask = (id: string) => {
    const updated = ticket.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    onUpdate({ subtasks: updated });
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      onUpdate({
        subtasks: [...ticket.subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]
      });
      setNewSubtask('');
    }
  };

  const removeSubtask = (id: string) => {
    onUpdate({ subtasks: ticket.subtasks.filter(s => s.id !== id) });
  };

  const addLabel = () => {
    if (newLabelText.trim() && !labels.includes(newLabelText.trim())) {
      const updatedLabels = [...labels, newLabelText.trim()];
      setLabels(updatedLabels);
      onUpdate({ labels: updatedLabels });
      setNewLabelText('');
      setIsAddingLabel(false);
    }
  };

  const removeLabel = (labelToRemove: string) => {
    const updatedLabels = labels.filter(l => l !== labelToRemove);
    setLabels(updatedLabels);
    onUpdate({ labels: updatedLabels });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TICKET DETAIL</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Title & Description */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ticket Title</label>
                  <input 
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveChanges}
                    className="w-full text-xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea 
                    value={description} onChange={(e) => setDescription(e.target.value)} onBlur={saveChanges}
                    placeholder="Add a more detailed description..."
                    className="w-full text-sm text-slate-600 bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 rounded-xl p-4 min-h-[120px] resize-none leading-relaxed"
                  />
                </div>

                {/* Subtasks Section */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Checklist</label>
                  <div className="space-y-2">
                    {ticket.subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 group">
                        <button 
                          onClick={() => toggleSubtask(sub.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${sub.completed ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-100' : 'border-slate-200 bg-white'}`}
                        >
                          {sub.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </button>
                        <span className={`text-sm flex-1 ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                          {sub.title}
                        </span>
                        <button onClick={() => removeSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-5 h-5 rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <Plus className="w-3 h-3 text-slate-300" />
                      </div>
                      <input 
                        type="text" placeholder="Add an item..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                        className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 placeholder-slate-300 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Metadata Pins */}
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Detail Properties</label>
                  
                  <div className="space-y-4">
                    {/* Priority */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500">Priority</span>
                      <select 
                        value={priority} onChange={(e) => { setPriority(e.target.value as KanbanPriority); onUpdate({ priority: e.target.value as KanbanPriority }); }}
                        className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    {/* Story Points */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500">Story Points</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" value={storyPoints} onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)} onBlur={saveChanges}
                          className="w-20 text-xs font-black bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="text-[11px] font-bold text-slate-400 italic">pts</span>
                      </div>
                    </div>

                    {/* Labels Management */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500">Labels</span>
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                        {labels.map(l => (
                          <span 
                            key={l} 
                            onClick={() => removeLabel(l)}
                            className="group relative text-[10px] font-black bg-white border border-slate-100 shadow-sm px-2 py-1 rounded-md text-slate-600 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            {l}
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-0.5 shadow-sm">
                              <X className="w-2 h-2" />
                            </div>
                          </span>
                        ))}
                        
                        <AnimatePresence>
                          {isAddingLabel ? (
                            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} className="flex items-center gap-1">
                              <input 
                                autoFocus
                                type="text"
                                value={newLabelText}
                                onChange={(e) => setNewLabelText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addLabel()}
                                onBlur={() => { if (!newLabelText) setIsAddingLabel(false); }}
                                placeholder="Label name..."
                                className="text-[10px] font-bold bg-white border border-blue-200 rounded-md px-2 py-1 outline-none w-24 shadow-sm"
                              />
                              <button onClick={addLabel} className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"><Check className="w-3 h-3" /></button>
                              <button onClick={() => setIsAddingLabel(false)} className="p-1 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200"><X className="w-3 h-3" /></button>
                            </motion.div>
                          ) : (
                            <button 
                              onClick={() => setIsAddingLabel(true)}
                              className="p-1 rounded-md border border-dashed border-slate-300 text-slate-300 hover:text-blue-400 hover:border-blue-400 transition-all flex items-center gap-1 px-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase tracking-tighter">New Label</span>
                            </button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => { onDelete(); onClose(); }}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-[11px] font-black tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" /> DELETE TICKET
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KanbanTicketModal;

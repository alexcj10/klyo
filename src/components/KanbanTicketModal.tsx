import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Trash2, 
  Plus
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    setHasUnsavedChanges(false);
    onClose();
  };

  const markDirty = () => setHasUnsavedChanges(true);

  const toggleSubtask = (id: string) => {
    const updated = ticket.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    onUpdate({ subtasks: updated });
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      const updatedSubtasks = [...ticket.subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }];
      onUpdate({ subtasks: updatedSubtasks });
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

  // Dynamic label colors matching KanbanBoard
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Dim overlay */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] sm:max-h-[85vh]"
        >
          {/* Header with Save button */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
            <span className="text-xs font-bold text-slate-600">Ticket Detail</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={saveChanges}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
                  hasUnsavedChanges 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3px]" />
                {hasUnsavedChanges ? 'Save' : 'Saved'}
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
            <div className="space-y-4">
              {/* Title with 100 char limit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-bold text-slate-400">Title</label>
                  <span className={`text-[9px] font-bold tabular-nums ${title.length > 90 ? 'text-red-500' : 'text-slate-300'}`}>
                    {title.length}/100
                  </span>
                </div>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => { setTitle(e.target.value.slice(0, 100)); markDirty(); }}
                  className="w-full text-base font-bold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 placeholder-slate-200 outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1 block">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  placeholder="Add a more detailed description..."
                  className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-50 focus:border-blue-200 rounded-xl p-3 min-h-[70px] resize-none leading-relaxed outline-none transition-all"
                />
              </div>

              {/* Properties Row */}
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400">Priority</span>
                  <select 
                    value={priority} 
                    onChange={(e) => { setPriority(e.target.value as KanbanPriority); markDirty(); }}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-2 focus:ring-blue-50 transition-all outline-none cursor-pointer"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400">Story Points</span>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" 
                      value={storyPoints} 
                      onChange={(e) => { setStoryPoints(parseInt(e.target.value) || 0); markDirty(); }}
                      className="w-16 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-blue-50"
                    />
                    <span className="text-[10px] font-medium text-slate-400">pts</span>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 mb-1.5 block">Labels</span>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {labels.map(l => (
                    <span 
                      key={l} 
                      onClick={() => removeLabel(l)}
                      className={`group relative text-[10px] font-bold border px-2.5 py-1 rounded-lg cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center gap-1 ${getLabelColor(l)}`}
                    >
                      {l}
                      <X className="w-2.5 h-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-current" />
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
                          placeholder="Label..."
                          className="text-[10px] font-bold bg-white border border-blue-200 rounded-lg px-2 py-1 outline-none w-20 shadow-sm focus:ring-2 focus:ring-blue-50"
                        />
                        <button onClick={addLabel} className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setIsAddingLabel(false)} className="p-1 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200"><X className="w-3 h-3" /></button>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingLabel(true)}
                        className="p-1 rounded-lg border border-dashed border-slate-300 text-slate-300 hover:text-blue-400 hover:border-blue-400 transition-all flex items-center gap-1 px-2"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="text-[9px] font-bold">Add</span>
                      </button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-2 block">
                  Checklist
                  {ticket.subtasks.length > 0 && (
                    <span className="ml-1.5 text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">
                      {ticket.subtasks.filter(s => s.completed).length}/{ticket.subtasks.length}
                    </span>
                  )}
                </label>
                <div className="space-y-1">
                  {ticket.subtasks.map(sub => (
                    <div key={sub.id} className="flex items-start gap-2.5 group py-1">
                      <button 
                        onClick={() => toggleSubtask(sub.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${sub.completed ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-100' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                      >
                        {sub.completed && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </button>
                      <span className={`text-sm flex-1 min-w-0 break-words ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                        {sub.title}
                      </span>
                      <button 
                        onClick={() => removeSubtask(sub.id)} 
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button 
                      onClick={addSubtask}
                      className="w-5 h-5 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center flex-shrink-0 hover:border-blue-400 hover:text-blue-500 text-slate-400 transition-all active:scale-95 bg-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <input 
                      type="text" 
                      placeholder="Add an item & press Enter..." 
                      value={newSubtask} 
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                      className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 placeholder-slate-300 font-medium outline-none min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 flex-shrink-0">
            <button 
              onClick={() => { onDelete(); onClose(); }}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Ticket
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KanbanTicketModal;

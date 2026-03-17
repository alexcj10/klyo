import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  CheckCircle2,
  ArrowRight,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { Task } from '../types';
import { format } from 'date-fns';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskComplete: (taskId: string) => void;
  onInlineTaskAdd: (title: string, status: Task['status']) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onTaskStatusChange, 
  onTaskDelete, 
  onTaskComplete,
  onInlineTaskAdd
}) => {
  const [addingToColumn, setAddingToColumn] = useState<Task['status'] | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Jira-inspired columns
  const columns: { id: Task['status']; title: string; color: string; bgColor: string }[] = [
    { id: 'todo', title: 'TO DO', color: 'bg-blue-600', bgColor: 'bg-gray-100/80' },
    { id: 'in-progress', title: 'IN PROGRESS', color: 'bg-amber-600', bgColor: 'bg-gray-100/80' },
    { id: 'done', title: 'DONE', color: 'bg-emerald-600', bgColor: 'bg-gray-100/80' }
  ];

  // Helper to ensure every task has a status for the board visibility
  const getTaskWithStatus = (task: Task): Task => {
    if (task.status) return task;
    return { ...task, status: task.completed ? 'done' : 'todo' };
  };

  const getPriorityInfo = (priority: Task['priority']) => {
    const info = {
      high: { border: 'border-l-red-500', color: 'text-red-600', label: 'H' },
      medium: { border: 'border-l-amber-500', color: 'text-amber-600', label: 'M' },
      low: { border: 'border-l-emerald-500', color: 'text-emerald-600', label: 'L' }
    };
    return info[priority] || info.low;
  };

  const handleInlineSubmit = (status: Task['status']) => {
    if (inlineTitle.trim()) {
      onInlineTaskAdd(inlineTitle.trim(), status);
      setInlineTitle('');
      setAddingToColumn(null);
    }
  };

  const handleClearDone = () => {
    const doneTasks = tasks.map(getTaskWithStatus).filter(t => t.status === 'done');
    doneTasks.forEach(t => onTaskDelete(t.id));
    setActiveMenu(null);
  };

  return (
    <div className="flex-1 flex overflow-x-auto p-2 sm:p-4 gap-3 custom-scrollbar bg-white" onClick={() => setActiveMenu(null)}>
      {columns.map((column) => {
        const columnTasks = tasks
          .map(getTaskWithStatus)
          .filter(t => t.status === column.id);

        return (
          <div key={column.id} className={`flex-1 min-w-[260px] max-w-[400px] flex flex-col rounded-xl ${column.bgColor} p-2`}>
            {/* Column Header - Very Compact */}
            <div className="flex items-center justify-between mb-2 px-1.5 pt-1 relative">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">
                  {column.title}
                </span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-200/50 px-1.5 py-0.5 rounded">
                  {columnTasks.length}
                </span>
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === column.id ? null : column.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-400 transition-colors"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
                
                <AnimatePresence>
                  {activeMenu === column.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 overflow-hidden"
                    >
                      {column.id === 'done' && (
                        <button 
                          onClick={handleClearDone}
                          className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          CLEAR DONE
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setAddingToColumn(column.id);
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        ADD TASK
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 min-h-0">
              <AnimatePresence mode="popLayout">
                {columnTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group bg-white rounded-lg border border-gray-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-2.5 relative border-l-4 ${getPriorityInfo(task.priority).border}`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2 overflow-hidden">
                        <h4 className={`text-xs font-bold text-gray-800 leading-snug break-all flex-1 ${task.completed ? 'line-through opacity-50' : ''}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button 
                            onClick={() => onTaskComplete(task.id)}
                            className={`p-1 rounded hover:bg-gray-100 ${task.completed ? 'text-emerald-500' : 'text-gray-400'}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onTaskDelete(task.id)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-1 rounded ${getPriorityInfo(task.priority).color} bg-gray-50 border border-gray-100`}>
                            {getPriorityInfo(task.priority).label}
                          </span>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                              <Calendar className="w-2.5 h-2.5" />
                              {format(new Date(task.dueDate), 'MMM d')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5">
                          {column.id !== 'todo' && (
                            <button 
                              onClick={() => onTaskStatusChange(task.id, column.id === 'done' ? 'in-progress' : 'todo')}
                              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 rotate-180"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {column.id !== 'done' && (
                            <button 
                              onClick={() => onTaskStatusChange(task.id, column.id === 'todo' ? 'in-progress' : 'done')}
                              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Inline Task Add Editor */}
              <AnimatePresence>
                {addingToColumn === column.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-lg border-2 border-blue-400 p-2 shadow-lg"
                  >
                    <textarea
                      autoFocus
                      placeholder="What's needs to be done?"
                      value={inlineTitle}
                      onChange={(e) => setInlineTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleInlineSubmit(column.id);
                        }
                        if (e.key === 'Escape') setAddingToColumn(null);
                      }}
                      className="w-full text-xs font-bold text-gray-800 placeholder-gray-300 bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[40px]"
                    />
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <button 
                        onClick={() => setAddingToColumn(null)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleInlineSubmit(column.id)}
                        disabled={!inlineTitle.trim()}
                        className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!addingToColumn && (
                <button
                  onClick={() => setAddingToColumn(column.id)}
                  className="w-full py-1.5 flex items-center gap-2 px-3 text-gray-400 hover:text-blue-600 hover:bg-gray-200/50 rounded-lg transition-all text-[11px] font-bold group"
                >
                  <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  CREATE
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;

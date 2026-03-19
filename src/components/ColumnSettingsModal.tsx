import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Layout, Palette, Type } from 'lucide-react';
import { KanbanColumn, ColumnTheme } from '../types';

interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  column: KanbanColumn;
  onUpdate: (updates: Partial<KanbanColumn>) => void;
}

export const COLUMN_THEMES: ColumnTheme[] = [
  { id: 'slate', label: 'Slate', color: 'bg-slate-500', bgColor: 'bg-slate-100/60' },
  { id: 'blue', label: 'Blue', color: 'bg-blue-600', bgColor: 'bg-blue-50/60' },
  { id: 'amber', label: 'Amber', color: 'bg-amber-600', bgColor: 'bg-amber-50/60' },
  { id: 'emerald', label: 'Emerald', color: 'bg-emerald-600', bgColor: 'bg-emerald-50/60' },
  { id: 'rose', label: 'Rose', color: 'bg-rose-600', bgColor: 'bg-rose-50/60' },
  { id: 'purple', label: 'Purple', color: 'bg-purple-600', bgColor: 'bg-purple-50/60' },
  { id: 'indigo', label: 'Indigo', color: 'bg-indigo-600', bgColor: 'bg-indigo-50/60' },
  { id: 'cyan', label: 'Cyan', color: 'bg-cyan-600', bgColor: 'bg-cyan-50/60' },
];

const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
  isOpen,
  onClose,
  column,
  onUpdate
}) => {
  const [title, setTitle] = useState(column.title);
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    const theme = COLUMN_THEMES.find(t => t.color === column.color);
    return theme ? theme.id : 'blue';
  });

  useEffect(() => {
    if (isOpen) {
      setTitle(column.title);
      const theme = COLUMN_THEMES.find(t => t.color === column.color);
      setSelectedThemeId(theme ? theme.id : 'blue');
    }
  }, [isOpen, column]);

  const handleSave = () => {
    const theme = COLUMN_THEMES.find(t => t.id === selectedThemeId);
    if (theme) {
      onUpdate({
        title: title.trim(),
        color: theme.color,
        bgColor: theme.bgColor
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Column Settings</h3>
                  <p className="text-[11px] font-medium text-slate-400">Customize appearance and title</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm hover:shadow border border-transparent hover:border-slate-100 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 ml-1">
                  <Type className="w-3.5 h-3.5" />
                  Column Title
                </label>
                <input 
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter column title..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 ml-1">
                  <Palette className="w-3.5 h-3.5" />
                  Color Theme
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {COLUMN_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`
                        group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all border-2
                        ${selectedThemeId === theme.id 
                          ? 'bg-blue-50/50 border-blue-500 shadow-md ring-4 ring-blue-50' 
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }
                      `}
                    >
                      <div className={`w-8 h-8 rounded-xl ${theme.color} shadow-sm group-hover:scale-110 transition-transform`} />
                      <span className={`text-[9px] font-bold ${selectedThemeId === theme.id ? 'text-blue-600' : 'text-slate-400'}`}>
                        {theme.label}
                      </span>
                      {selectedThemeId === theme.id && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                          <Check className="w-3 h-3 stroke-[3px]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 block">
                  Live Preview
                </label>
                <div className={`p-4 rounded-2xl border border-slate-100 flex items-center gap-3 ${COLUMN_THEMES.find(t => t.id === selectedThemeId)?.bgColor}`}>
                  <div className={`w-1.5 h-6 rounded-full ${COLUMN_THEMES.find(t => t.id === selectedThemeId)?.color}`} />
                  <span className="text-sm font-bold text-slate-800">
                    {title || 'Untitled Column'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 bg-slate-50/80 border-t border-slate-100 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white text-slate-600 text-sm font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-2xl border border-blue-700 shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ColumnSettingsModal;

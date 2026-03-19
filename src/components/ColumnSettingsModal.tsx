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

  const selectedTheme = COLUMN_THEMES.find(t => t.id === selectedThemeId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Dim overlay */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center bg-slate-50/50 relative">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Layout className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-slate-800">Column Settings</h2>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="absolute top-2.5 right-2.5 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Title Input */}
            <div>
              <div className="flex items-center gap-1 mb-1 text-slate-400">
                <Type className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Title</span>
              </div>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter column title..."
                className="w-full text-xs font-bold text-slate-800 bg-slate-50/50 border border-slate-100 rounded-lg px-3 py-2 placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all font-mono"
              />
            </div>

              {/* Color Theme Selector */}
            {/* Theme Grid */}
            <div>
              <div className="flex items-center gap-1 mb-2 text-slate-400">
                <Palette className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Theme</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                  {COLUMN_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`
                      relative flex flex-col items-center justify-center p-1.5 rounded-lg border-[1.5px] transition-all group/theme
                      ${selectedThemeId === theme.id 
                        ? 'border-blue-500 bg-blue-50/30' 
                        : 'border-slate-100 bg-white hover:border-slate-200'}
                    `}
                  >
                    <div className={`w-5 h-5 rounded-full mb-1 shadow-sm ${theme.color}`} />
                    <span className="text-[8px] font-bold text-slate-500">{theme.label}</span>
                      {selectedThemeId === theme.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center shadow shadow-blue-200 border border-white">
                          <Check className="w-2.5 h-2.5 stroke-[3px]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

            {/* Preview Section */}
            <div>
              <div className="flex items-center gap-1 mb-2 text-slate-400">
                <div className="text-[9px] font-bold uppercase tracking-wider">Preview</div>
              </div>
              <div className={`p-2.5 rounded-lg border border-slate-100 ${selectedTheme?.bgColor}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-3.5 rounded-full ${selectedTheme?.color}`} />
                  <span className="text-[11px] font-bold text-slate-800">{title || 'Column'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/30 flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={onClose}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow shadow-blue-200 transition-all active:scale-[0.98]"
            >
              Save
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default ColumnSettingsModal;

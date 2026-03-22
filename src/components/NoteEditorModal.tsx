import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, StickyNote, Pencil } from 'lucide-react';
import { Note } from '../types';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string | 'new' | null;
  notes: Note[];
  onSave: (note: Pick<Note, 'title' | 'content'> & { id?: string }) => void;
  onDelete: (noteId: string) => void;
}

const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  noteId,
  notes,
  onSave,
  onDelete
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && noteId && noteId !== 'new') {
      const existingNote = notes.find(n => n.id === noteId);
      if (existingNote) {
        setTitle(existingNote.title);
        setContent(existingNote.content);
        setIsEditing(false);
      }
    } else if (isOpen && noteId === 'new') {
      setTitle('');
      setContent('');
      setIsEditing(true);
    }
    setIsDeleting(false);
  }, [isOpen, noteId, notes]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    onSave({
      id: noteId === 'new' ? undefined : noteId!,
      title: title.trim() || 'Untitled',
      content: content.trim()
    });
    onClose();
  };

  const handleCancelEdit = () => {
    if (noteId === 'new') {
      onClose();
    } else {
      const existingNote = notes.find(n => n.id === noteId);
      if (existingNote) {
        setTitle(existingNote.title);
        setContent(existingNote.content);
      }
      setIsEditing(false);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 perspective-1000">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40"
        />

        <motion.div
          initial={{ opacity: 0, y: '100%', rotateX: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          exit={{ opacity: 0, y: '100%', rotateX: 10, scale: 0.95 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="relative w-full max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[65vh] sm:max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm border border-amber-200/50">
                <StickyNote className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-slate-800 leading-tight">
                  {noteId === 'new' ? 'Create Note' : (isEditing ? 'Edit Note' : 'View Note')}
                </h2>
                <p className="text-[11px] font-medium text-slate-500">
                  {noteId === 'new' ? 'Jot down your thoughts' : (isEditing ? 'Update this entry' : 'Notes from your board')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-white">
            {isEditing ? (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 h-full flex flex-col">
                <div className="space-y-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Note Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSave()}
                    className="w-full text-base sm:text-lg font-bold text-slate-800 bg-white rounded-lg border border-slate-200 focus:border-amber-300 outline-none px-3 py-2.5 transition-all shadow-sm placeholder-slate-300"
                  />
                </div>

                <div className="space-y-1 flex-1 flex flex-col min-h-[150px]">
                  <textarea
                    placeholder="List your thoughts here... (each line is a bullet)"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full flex-1 text-sm font-medium text-slate-600 bg-white rounded-lg border border-slate-200 focus:border-amber-300 outline-none px-3 py-2.5 resize-none leading-relaxed transition-all shadow-sm placeholder-slate-300 custom-scrollbar min-h-[100px]"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h3 className="text-[15px] sm:text-base font-bold text-slate-800 tracking-tight leading-snug break-words">
                    {title}
                  </h3>
                </div>
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  {content.split('\n').map((line, i) => line.trim() ? (
                    <div key={i} className="flex items-start gap-2.5 mb-1.5 leading-relaxed w-full">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-sm shadow-amber-400/20 flex-shrink-0" />
                      <span className="text-xs sm:text-[13px] font-medium text-slate-700 break-words flex-1 whitespace-pre-wrap">{line}</span>
                    </div>
                  ) : null)}
                  {!content.trim() && (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      No additional notes.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between flex-shrink-0 gap-3 safe-area-bottom">
            {noteId !== 'new' ? (
              <div className="relative">
                <AnimatePresence mode="wait">
                  {!isDeleting ? (
                    <motion.button
                      key="delete-btn"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setIsDeleting(true)}
                      className="p-2 sm:px-3 sm:py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1.5 group border border-transparent"
                    >
                      <Trash2 className="w-4 h-4 sm:w-[14px] sm:h-[14px] group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline text-xs font-bold">Delete</span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="confirm-del"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg p-1"
                    >
                      <button onClick={() => setIsDeleting(false)} className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-white rounded transition-colors">Cancel</button>
                      <button onClick={() => { onDelete(noteId!); onClose(); }} className="px-2 py-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded transition-colors shadow-sm focus:ring-2 focus:ring-red-200">Confirm</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div /> // Spacer
            )}

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  {noteId !== 'new' && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-200/50 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!title.trim() && !content.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-200 hover:border-amber-300 hover:text-amber-600 text-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NoteEditorModal;

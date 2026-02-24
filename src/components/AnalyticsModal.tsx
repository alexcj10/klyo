import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3 } from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import { Event, Task } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  tasks: Task[];
  onAddEvent?: () => void;
  onAddTask?: () => void;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, events, tasks, onAddEvent, onAddTask }) => {
  const hasData = events.length > 0 || tasks.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-[94%] sm:w-full ${hasData ? 'max-w-[340px] sm:max-w-[95%] md:max-w-[85%] lg:max-w-[85%] xl:max-w-5xl' : 'max-w-[340px] sm:max-w-lg'} max-h-[70vh] sm:max-h-[90vh] md:max-h-[80vh] lg:max-h-[85vh] xl:max-h-[85vh] bg-gray-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Compact */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate leading-tight">Analytics</h2>
                  <p className="text-xs text-gray-500 truncate">Activity insights</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            {/* Content */}
            <div className={hasData ? "overflow-y-auto max-h-[calc(70vh-100px)] sm:max-h-[calc(90vh-100px)] md:max-h-[calc(80vh-100px)] lg:max-h-[calc(85vh-100px)] xl:max-h-[calc(90vh-100px)] scrollbar-hide" : "flex-1 flex items-center justify-center px-4 sm:px-6"}>
              <div className={hasData ? "px-4 sm:px-6 py-6 sm:py-8" : "w-full flex items-center justify-center min-h-[350px] sm:min-h-[400px]"}>
                <AnalyticsDashboard events={events} tasks={tasks} onAddEvent={onAddEvent} onAddTask={onAddTask} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalyticsModal;

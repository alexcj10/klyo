import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full ${hasData ? 'max-w-5xl' : 'max-w-lg'} max-h-[95vh] sm:max-h-[90vh] bg-gray-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 bg-white border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs sm:text-sm">📊</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Analytics Dashboard</h2>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Insights into your productivity</p>
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
            <div className={hasData ? "overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-80px)] scrollbar-hide p-4 sm:p-6" : "flex-1 flex items-center justify-center py-4 px-4 sm:px-6 min-h-0"}>
              <AnalyticsDashboard events={events} tasks={tasks} onAddEvent={onAddEvent} onAddTask={onAddTask} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalyticsModal;

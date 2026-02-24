import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit3, Trash2, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '../types';

interface DayViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventDelete: (event: Event) => void;
  onAddEvent: (date: Date) => void;
}

const DayViewModal: React.FC<DayViewModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  onEventClick,
  onEventDelete,
  onAddEvent
}) => {
  const [deleteConfirmEvent, setDeleteConfirmEvent] = React.useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !date) return null;

  const handleDeleteClick = (event: Event) => {
    setDeleteConfirmEvent(event);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmEvent && !isDeleting) {
      setIsDeleting(true);

      // Immediately close the confirmation dialog
      setDeleteConfirmEvent(null);

      // Use setTimeout to allow the UI to update immediately
      setTimeout(() => {
        onEventDelete(deleteConfirmEvent);
        setIsDeleting(false);
      }, 0);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmEvent(null);
  };

  const getCategoryColorClass = (category: string) => {
    const colors = {
      work: 'text-blue-600 bg-blue-50 border-blue-200',
      personal: 'text-purple-600 bg-purple-50 border-purple-200',
      health: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      social: 'text-orange-600 bg-orange-50 border-orange-200',
      other: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    if (a.isAllDay && b.isAllDay) return 0;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dayview-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 z-[55] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="dayview-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-xl max-w-[340px] sm:max-w-md lg:max-w-lg w-[94%] sm:w-full max-h-[70vh] sm:max-h-[80vh] overflow-hidden border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                  {format(date, 'EEE, MMM d')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {events.length} {events.length === 1 ? 'event' : 'events'}
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAddEvent(date)}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg shadow-sm transition-all duration-200"
                  title="Add Event"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="p-3 sm:p-4 space-y-2 max-h-[calc(70vh-100px)] sm:max-h-[calc(80vh-100px)] overflow-y-auto">
            {events.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500"
              >
                <div className="text-4xl mb-2">📅</div>
                <p className="font-medium mb-2">No events today</p>
                <p className="text-sm mb-4">Add your first event for this day</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAddEvent(date)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
                >
                  Add Event
                </motion.button>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {sortedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.03, duration: 0.15 }}
                    className={`bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-all duration-200 ${isDeleting && deleteConfirmEvent?.id === event.id ? 'opacity-50 pointer-events-none' : ''
                      }`}
                  >
                    {/* Top row: Color dot + Title + Actions */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        ></div>
                        <h3 className="font-semibold text-gray-800 text-sm truncate">
                          {event.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEventClick(event)}
                          className="text-blue-500 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                          disabled={isDeleting}
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteClick(event)}
                          className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Bottom row: Time + Category + Priority */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        {event.isAllDay ? (
                          <>
                            <Calendar className="w-3 h-3" />
                            <span>All day</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>{event.startTime} - {event.endTime}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCategoryColorClass(event.category)}`}>
                          {event.category}
                        </span>
                        <span className="flex items-center space-x-0.5">
                          <span>⚡</span>
                          <span className="capitalize">{event.priority}</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Ultra-fast Delete Confirmation */}
          <AnimatePresence mode="wait">
            {deleteConfirmEvent && (
              <motion.div
                key="delete-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]"
              >
                <motion.div
                  key="delete-dialog"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-2xl p-5 max-w-[320px] w-full mx-auto overflow-hidden border border-gray-100"
                >
                  <div className="flex items-center space-x-3 mb-4 text-left">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Delete Event
                    </h3>
                  </div>

                  <p className="text-[15px] text-gray-600 mb-6 leading-relaxed font-medium text-left">
                    Are you sure you want to delete this event? This action cannot be undone.
                  </p>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelDelete}
                      className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                      disabled={isDeleting}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirmDelete}
                      className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-all duration-200"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DayViewModal;

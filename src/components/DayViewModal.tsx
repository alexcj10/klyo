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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="dayview-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-xl max-w-sm sm:max-w-md lg:max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {format(date, 'EEEE, MMMM d')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {events.length} {events.length === 1 ? 'event' : 'events'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAddEvent(date)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  title="Add Event"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="p-4 sm:p-6 space-y-2 sm:space-y-3 max-h-[calc(85vh-120px)] sm:max-h-[calc(80vh-120px)] overflow-y-auto scrollbar-hide">
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
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Add Event
                </motion.button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className={`bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-200 group ${
                      isDeleting && deleteConfirmEvent?.id === event.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: event.color }}
                          ></div>
                          <h3 className="font-semibold text-gray-800 text-sm truncate">
                            {event.title}
                          </h3>
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0
                            ${getCategoryColorClass(event.category)}
                          `}>
                            {event.category}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            {event.isAllDay ? (
                              <>
                                <Calendar className="w-3 h-3" />
                                <span>All day</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                <span className="truncate">
                                  {event.startTime} - {event.endTime}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>⚡</span>
                            <span className="capitalize">{event.priority}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEventClick(event)}
                          className="text-indigo-500 hover:text-indigo-700 transition-colors duration-200 p-1"
                          title="Edit Event"
                          disabled={isDeleting}
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteClick(event)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1"
                          title="Delete Event"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
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
                transition={{ duration: 0.02 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl"
              >
                <motion.div
                  key="delete-dialog"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.02 }}
                  className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Delete Event
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this event?
                    </p>
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancelDelete}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                        disabled={isDeleting}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirmDelete}
                        className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </motion.button>
                    </div>
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

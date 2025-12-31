import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '../types';

interface EventViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  allEvents?: Event[];
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const EventViewModal: React.FC<EventViewModalProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  allEvents = [],
  onNavigate
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  if (!isOpen || !event) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(event);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      work: '💼',
      personal: '🏠',
      health: '🏃',
      social: '👥',
      other: '📝'
    };
    return icons[category as keyof typeof icons] || icons.other;
  };

  const getPriorityIcon = (priority: string) => {
    const icons = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };
    return icons[priority as keyof typeof icons] || icons.medium;
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

  // Navigation helpers
  const currentIndex = allEvents.findIndex(e => e.id === event?.id);
  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < allEvents.length - 1;

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (onNavigate) {
      onNavigate(direction);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[65] flex items-center justify-center p-3"
        onClick={onClose}
      >
        {/* Invisible Touch Zones for Navigation */}
        {onNavigate && allEvents.length > 1 && (
          <>
            {/* Left Touch Zone - 40% of screen width */}
            {canNavigatePrev && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation('prev');
                }}
                className="absolute left-0 top-0 bottom-0 w-[40%] z-10 cursor-pointer active:bg-white/5"
                aria-label="Previous event"
              />
            )}

            {/* Right Touch Zone - 40% of screen width */}
            {canNavigateNext && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation('next');
                }}
                className="absolute right-0 top-0 bottom-0 w-[40%] z-10 cursor-pointer active:bg-white/5"
                aria-label="Next event"
              />
            )}
          </>
        )}

        <motion.div
          key={event?.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.4
          }}
          className="bg-white rounded-xl shadow-xl w-[94%] max-w-[340px] sm:max-w-sm mx-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Simple Header */}
          <div className="relative px-3 sm:px-6 py-3 sm:py-6 border-b border-gray-100">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Event Counter */}
            {allEvents.length > 1 && (
              <div className="text-xs text-gray-500 mb-3">
                {currentIndex + 1} of {allEvents.length}
              </div>
            )}

            {/* Event Info */}
            <div className="flex items-start space-x-3 mb-4">
              <div
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: event.color }}
              ></div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 leading-tight break-words pr-8">
                  {event.title}
                </h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{format(event.date, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  {!event.isAllDay && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  )}
                  {event.isAllDay && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">📌</span>
                      <span>All day event</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Simple Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(event)}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Simple Content */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 overflow-y-auto max-h-[40vh] sm:max-h-[60vh]">

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Category</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(event.category)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getCategoryColorClass(event.category)}`}>
                    {event.category}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-1">Priority</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPriorityIcon(event.priority)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${event.priority === 'high' ? 'text-red-700 bg-red-100' :
                    event.priority === 'medium' ? 'text-orange-700 bg-orange-100' :
                      'text-emerald-700 bg-emerald-100'
                    }`}>
                    {event.priority}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
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
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-all duration-200"
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventViewModal;
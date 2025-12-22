import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  Rows3,
  Trash2
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  setHours,
  setMinutes
} from 'date-fns';
import { Event } from '../types';

interface CalendarViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventView: (event: Event) => void;
  onDateClick: (date: Date) => void;
  onAddEvent: () => void;
  onDayViewOpen: (date: Date) => void;
  onEventDelete: (event: Event) => void;
  isSidebarOpen?: boolean;
}

type ViewMode = 'month' | 'week';

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventView,
  onDateClick,
  onAddEvent,
  onDayViewOpen,
  onEventDelete,
  isSidebarOpen
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);

  // Navigation handlers
  const navigatePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  // Month view data
  const monthData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Week view data
  const weekData = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Hours for week view
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Delete handlers
  const handleConfirmDelete = () => {
    if (deleteConfirmEvent) {
      onEventDelete(deleteConfirmEvent);
      setDeleteConfirmEvent(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmEvent(null);
  };

  // Calculate number of weeks for proper grid
  const numWeeks = Math.ceil(monthData.length / 7);

  // Dynamic max events based on screen space
  const [maxEvents, setMaxEvents] = useState(3);

  useEffect(() => {
    const calculateMaxEvents = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;

      // Approximate header heights (Main Header + Calendar Navigation + Weekday Headers)
      const headHeight = width < 640 ? 140 : 180;
      const availableHeight = height - headHeight;
      const cellHeight = availableHeight / numWeeks;

      // Reserve space for date number (28px) and some padding/margin (8px)
      // Each event bar is roughly 16px (mobile) to 18px (desktop)
      const eventHeight = width < 640 ? 15 : 18;
      const reservedSpace = width < 640 ? 32 : 44;

      const count = Math.floor((cellHeight - reservedSpace) / eventHeight);

      // Enforce a minimum of 1 event and a reasonable max
      setMaxEvents(Math.max(1, Math.min(count, 12)));
    };

    calculateMaxEvents();
    window.addEventListener('resize', calculateMaxEvents);
    return () => window.removeEventListener('resize', calculateMaxEvents);
  }, [numWeeks]);

  // Month View Component
  const MonthView = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
          <div
            key={day}
            className={`
              py-3 text-center text-xs font-semibold uppercase tracking-wider
              ${idx === 0 || idx === 6 ? 'text-gray-400' : 'text-gray-600'}
            `}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid - Strictly non-expanding grid */}
      <div
        className="grid grid-cols-7 flex-1 min-h-0"
        style={{
          gridTemplateRows: `repeat(${numWeeks}, minmax(0, 1fr))`
        }}
      >
        {monthData.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isCurrentDay = isToday(date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.005 }}
              onClick={() => onDateClick(date)}
              className={`
                p-1 sm:p-2 border-r border-b border-gray-100 last:border-r-0 flex flex-col min-h-0 overflow-hidden
                ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                ${isWeekend ? 'bg-gray-50/30' : ''}
                hover:bg-blue-50/30 transition-colors cursor-pointer group
              `}
            >
              {/* Date Number */}
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`
                    text-[10px] sm:text-xs font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-colors
                    ${isCurrentDay
                      ? 'bg-blue-500 text-white'
                      : isCurrentMonth
                        ? 'text-gray-900 group-hover:bg-gray-100'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {format(date, 'd')}
                </span>
              </div>

              {/* Events Container - Strictly limited */}
              <div className="flex-1 flex flex-col min-h-0 space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, dayEvents.length > maxEvents ? maxEvents - 1 : maxEvents).map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayViewOpen(date);
                    }}
                    className="cursor-pointer flex-shrink-0"
                  >
                    <div
                      className="px-1 py-0.5 rounded text-[8px] sm:text-[9px] md:text-[10px] font-medium truncate hover:opacity-80 transition-opacity leading-tight"
                      style={{
                        backgroundColor: `${event.color}15`,
                        color: event.color,
                        borderLeft: `2px solid ${event.color}`
                      }}
                    >
                      <span className="truncate">{event.title}</span>
                    </div>
                  </motion.div>
                ))}

                {/* More Events Indicator - Always stays in bounds */}
                {dayEvents.length > maxEvents && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayViewOpen(date);
                    }}
                    className="mt-0.5 text-[8px] sm:text-[9px] text-blue-600 font-bold px-0.5 hover:text-blue-700 transition-colors flex-shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    +{dayEvents.length - (maxEvents - 1)} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // Week View Component
  const WeekView = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-auto">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="p-2 border-r border-gray-100" /> {/* Time column header */}
        {weekData.map((date) => {
          const isCurrentDay = isToday(date);
          return (
            <div
              key={date.toISOString()}
              className="p-2 text-center border-r border-gray-100 last:border-r-0"
            >
              <div className="text-xs text-gray-500 font-medium uppercase">
                {format(date, 'EEE')}
              </div>
              <div
                className={`
                  text-lg sm:text-xl font-semibold mt-1
                  ${isCurrentDay ? 'text-red-500' : 'text-gray-900'}
                `}
              >
                {format(date, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="flex-1">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[48px]">
            {/* Time Label */}
            <div className="p-1 text-xs text-gray-400 text-right pr-2 border-r border-gray-100">
              {format(setMinutes(setHours(new Date(), hour), 0), 'h a')}
            </div>

            {/* Day Columns */}
            {weekData.map((date) => {
              const dayEvents = getEventsForDate(date).filter(event => {
                if (event.isAllDay) return hour === 0;
                const eventHour = parseInt(event.startTime.split(':')[0]);
                return eventHour === hour;
              });

              return (
                <div
                  key={`${date.toISOString()}-${hour}`}
                  onClick={() => {
                    const clickedDateTime = setMinutes(setHours(date, hour), 0);
                    onDateClick(clickedDateTime);
                  }}
                  className="border-r border-gray-100 last:border-r-0 p-0.5 hover:bg-blue-50/30 cursor-pointer transition-colors relative"
                >
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventView(event);
                      }}
                      className="text-[10px] sm:text-xs p-1 rounded truncate cursor-pointer hover:shadow-sm"
                      style={{
                        backgroundColor: `${event.color}20`,
                        color: event.color,
                        borderLeft: `2px solid ${event.color}`
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden h-full flex flex-col relative">
      {/* Header - Clean Mobile Design */}
      <div className="px-2 sm:px-6 py-3 border-b border-blue-200 flex-shrink-0 bg-blue-100/70 backdrop-blur-sm">
        {/* Mobile: Centered nav layout */}
        <div className="flex items-center justify-between">
          {/* Navigation Arrows + Title */}
          <div className="flex items-center flex-1 min-w-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={navigatePrev}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </motion.button>

            <h2 className="text-base sm:text-xl font-bold text-gray-900 flex-1 text-center whitespace-nowrap truncate px-1">
              {viewMode === 'month'
                ? format(currentDate, 'MMMM yyyy')
                : `${format(startOfWeek(currentDate), 'MMMM d')}`
              }
            </h2>

            {/* Inline Today indicator - shows when not on current month */}
            {format(currentDate, 'yyyy-MM') !== format(new Date(), 'yyyy-MM') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
                className="text-[10px] sm:text-xs text-blue-600 font-semibold px-2 py-0.5 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0 mr-1"
              >
                Today
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={navigateNext}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>

          {/* View Toggle - Simple Pills */}
          <div className="flex items-center bg-gray-100 rounded-full p-0.5 ml-1 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('month')}
              className={`
                p-1.5 sm:px-3 sm:py-1 rounded-full transition-all flex items-center space-x-1
                ${viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
                }
              `}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Month</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('week')}
              className={`
                p-1.5 sm:px-3 sm:py-1 rounded-full transition-all flex items-center space-x-1
                ${viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
                }
              `}
            >
              <Rows3 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Week</span>
            </motion.button>
          </div>
        </div>
      </div>



      {/* Calendar Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {viewMode === 'month' ? <MonthView /> : <WeekView />}
        </motion.div>
      </AnimatePresence>

      {/* Floating Add Button */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddEvent}
            className="fixed bottom-24 right-6 bg-blue-500 hover:bg-blue-600 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:shadow-xl transition-all z-30 flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelDelete}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Event</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deleteConfirmEvent.title}"? This action cannot be undone.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Grid3X3, List, Edit3, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Event } from '../types';

interface CalendarViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventView: (event: Event) => void;
  onDateClick: (date: Date) => void;
  onAddEvent: () => void;
  onDayViewOpen: (date: Date) => void;
  onEventDelete: (event: Event) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventClick,
  onEventView,
  onDateClick,
  onAddEvent,
  onDayViewOpen,
  onEventDelete
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmEvent, setDeleteConfirmEvent] = React.useState<Event | null>(null);
  const [maxEventsPerCell, setMaxEventsPerCell] = React.useState(2);

  React.useEffect(() => {
    const calculateMaxEvents = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // More precise calculations for different screen sizes
      let headerHeight, monthNavHeight, dayLabelsHeight, padding, eventHeight, dateHeight, spacing;
      
      if (screenWidth < 640) { // Mobile
        headerHeight = 80;
        monthNavHeight = 60;
        dayLabelsHeight = 32;
        padding = 16;
        eventHeight = 16; // Smaller events on mobile
        dateHeight = 16;
        spacing = 2;
      } else if (screenWidth < 1024) { // Tablet
        headerHeight = 100;
        monthNavHeight = 60;
        dayLabelsHeight = 36;
        padding = 24;
        eventHeight = 20;
        dateHeight = 18;
        spacing = 4;
      } else if (screenWidth < 1280) { // Desktop
        headerHeight = 120;
        monthNavHeight = 60;
        dayLabelsHeight = 40;
        padding = 32;
        eventHeight = 22;
        dateHeight = 20;
        spacing = 4;
      } else { // Large desktop
        headerHeight = 120;
        monthNavHeight = 60;
        dayLabelsHeight = 44;
        padding = 40;
        eventHeight = 24;
        dateHeight = 20;
        spacing = 6;
      }
      
      const availableHeight = screenHeight - headerHeight - monthNavHeight - dayLabelsHeight - padding;
      const cellHeight = availableHeight / 6; // 6 rows in calendar
      
      // Account for cell padding
      const cellPadding = screenWidth < 640 ? 4 : screenWidth < 1024 ? 8 : 12;
      const availableEventSpace = cellHeight - dateHeight - spacing - (cellPadding * 2);
      
      // Calculate max events with tighter spacing
      const eventSpacing = screenWidth < 640 ? 1 : 2;
      const maxEvents = Math.floor(availableEventSpace / (eventHeight + eventSpacing));
      
      // Dynamic bounds based on screen size
      const minEvents = screenWidth < 640 ? 2 : 3;
      const maxEventsCap = screenWidth < 640 ? 6 : screenWidth < 1024 ? 8 : 10;
      
      const maxEventsCapped = Math.min(Math.max(maxEvents, minEvents), maxEventsCap);
      
      setMaxEventsPerCell(maxEventsCapped);
    };

    calculateMaxEvents();
    window.addEventListener('resize', calculateMaxEvents);
    
    return () => window.removeEventListener('resize', calculateMaxEvents);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get events for the current month for list view
  const monthEvents = events.filter(event => 
    isWithinInterval(event.date, { start: startOfDay(monthStart), end: endOfDay(monthEnd) })
  ).sort((a, b) => a.date.getTime() - b.date.getTime());

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
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

  const handleDeleteClick = (event: Event) => {
    setDeleteConfirmEvent(event);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmEvent) {
      onEventDelete(deleteConfirmEvent);
      setDeleteConfirmEvent(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmEvent(null);
  };

  const renderGridView = () => (
    <>
      {/* Days of Week Header - Optimized spacing */}
      <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-200/50 flex-shrink-0">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
          <div key={day} className="px-0.5 sm:px-1 lg:px-2 py-1.5 sm:py-2 lg:py-3 text-center text-xs sm:text-sm font-medium text-gray-600">
            <span className="md:hidden">{day.slice(0, 1)}</span>
            <span className="hidden md:inline lg:hidden">{day.slice(0, 3)}</span>
            <span className="hidden lg:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid - Optimized for maximum event display */}
      <div className="grid grid-cols-7 gap-0 flex-1 min-h-0 auto-rows-fr">
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isCurrentDay = isToday(date);

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => onDateClick(date)}
              className={`
                min-h-[60px] sm:min-h-[80px] lg:min-h-[120px] xl:min-h-[140px] 
                p-0.5 sm:p-1 lg:p-1.5 xl:p-2 border-b border-r border-gray-200/50 cursor-pointer
                hover:bg-gray-50 transition-colors duration-200 flex flex-col
                ${!isCurrentMonth ? 'bg-gray-50/50' : ''}
                ${isCurrentDay ? 'bg-indigo-50/50' : ''}
              `}
            >
              {/* Date header - Minimized spacing */}
              <div className="flex items-center justify-between mb-0.5 sm:mb-1 flex-shrink-0 h-4 sm:h-5">
                <span className={`
                  text-xs sm:text-sm lg:text-base font-medium leading-none
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                  ${isCurrentDay ? 'text-indigo-600 font-semibold' : ''}
                `}>
                  {format(date, 'd')}
                </span>
                {isCurrentDay && (
                  <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                )}
              </div>

              {/* Events container - Optimized spacing */}
              <div className="space-y-0.5 flex-1 min-h-0 overflow-hidden">
                {dayEvents.slice(0, maxEventsPerCell).map((event, eventIndex) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: eventIndex * 0.05 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayViewOpen(date);
                    }}
                    className={`
                      px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md 
                      text-xs font-medium text-white leading-tight
                      cursor-pointer hover:shadow-md transition-all duration-200
                      block w-full overflow-hidden whitespace-nowrap
                      h-4 sm:h-5 lg:h-5.5 xl:h-6
                      flex items-center
                    `}
                    style={{ 
                      backgroundColor: event.color,
                      fontSize: window.innerWidth < 640 ? '10px' : window.innerWidth < 1024 ? '11px' : '12px'
                    }}
                    title={`${event.title} - Click to view day details`}
                  >
                    <span className="block truncate leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                      {event.title}
                    </span>
                  </motion.div>
                ))}
                {dayEvents.length > maxEventsPerCell && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayViewOpen(date);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 px-1 cursor-pointer font-medium hover:bg-indigo-50 rounded transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis h-4 sm:h-5 flex items-center leading-none"
                    style={{ fontSize: window.innerWidth < 640 ? '9px' : '10px' }}
                  >
                    +{dayEvents.length - maxEventsPerCell} more
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );

  const renderListView = () => (
    <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-1.5 sm:space-y-2">
      {monthEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500"
        >
          <div className="text-4xl mb-2">📅</div>
          <p className="font-medium">No events this month</p>
          <p className="text-sm">Click on a date to add an event</p>
        </motion.div>
      ) : (
        monthEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200/50 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all duration-200 group relative cursor-pointer"
            onClick={() => onEventView(event)}
          >
            {/* Color accent bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: event.color }}
            ></div>
            
            <div className="p-2 sm:p-3 lg:p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <div 
                      className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    ></div>
                    <h3 className="font-semibold text-gray-800 text-sm lg:text-base truncate">
                      {event.title}
                    </h3>
                    <span className={`
                      px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0
                      ${getCategoryColorClass(event.category)}
                    `}>
                      {event.category}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-1">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-gray-500 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <span>📅</span>
                      <span className="whitespace-nowrap">
                        <span className="hidden sm:inline">{format(event.date, 'MMM d, yyyy')}</span>
                        <span className="sm:hidden">{format(event.date, 'MMM d')}</span>
                      </span>
                    </div>
                    {!event.isAllDay && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <span>🕐</span>
                        <span className="whitespace-nowrap">
                          <span className="hidden sm:inline">{event.startTime} - {event.endTime}</span>
                          <span className="sm:hidden">{event.startTime}</span>
                        </span>
                      </div>
                    )}
                    {event.isAllDay && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <span>📌</span>
                        <span className="whitespace-nowrap">
                          <span className="hidden sm:inline">All day</span>
                          <span className="sm:hidden">All</span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <span>⚡</span>
                      <span className="capitalize whitespace-nowrap">
                        {event.priority}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Inline Action Buttons */}
                <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className="text-indigo-500 hover:text-indigo-700 transition-colors duration-200 p-1 sm:p-1.5 rounded-md hover:bg-indigo-50"
                    title="Edit Event"
                  >
                    <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(event);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 sm:p-1.5 rounded-md hover:bg-red-50"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-200/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-x-2 sm:gap-x-4 flex-nowrap">
          
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
            <span className="sm:hidden">{format(currentDate, 'MMM yyyy')}</span>
            <span className="hidden sm:inline">{format(currentDate, 'MMMM yyyy')}</span>
          </h2>
          
          <div className="flex items-center flex-shrink-0 gap-x-1 sm:gap-x-2">
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToToday}
              className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-indigo-600 hover:bg-white/50 rounded-xl transition-colors duration-200"
              title="Go to Today"
            >
              Today
            </motion.button>

            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateMonth('prev')}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/50 transition-colors duration-200"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateMonth('next')}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/50 transition-colors duration-200"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </motion.button>
            </div>

            <div className="flex bg-white/70 rounded-xl p-0.5 sm:p-1 shadow-sm border border-white/50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('grid')}
                className={`
                  p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-md text-indigo-600 border border-indigo-200/50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('list')}
                className={`
                  p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-md text-indigo-600 border border-indigo-200/50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col min-h-0"
      >
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddEvent}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-30"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.button>

      {deleteConfirmEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200"
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;

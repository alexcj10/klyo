import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  Rows3,
  CalendarDays,
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
  addYears,
  subYears,
  addDays,
  subDays,
  getYear,
  isSameDay,
  setHours,
  setMinutes
} from 'date-fns';
import { Event } from '../types';
import DateSelectorPopup from './DateSelectorPopup';

interface CalendarViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventView: (event: Event) => void;
  onDateClick: (date: Date, isTimeSpecific?: boolean) => void;
  onAddEvent: () => void;
  onDayViewOpen: (date: Date) => void;
  onEventDelete: (event: Event) => void;
  isSidebarOpen?: boolean;
}

type ViewMode = 'day' | 'week' | 'month' | 'year';

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventView,
  onDateClick,
  onAddEvent,
  onDayViewOpen,
  onEventDelete,
  isSidebarOpen
}) => {
  const isDraggingRef = useRef(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Navigation handlers
  const navigatePrev = () => {
    if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subYears(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addYears(currentDate, 1));
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

  // Day View Component
  const DayView = () => (
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onDragStart={() => { isDraggingRef.current = true; }}
      onDragEnd={(_, info) => {
        const threshold = 30;
        if (info.offset.x > threshold) {
          navigatePrev();
        } else if (info.offset.x < -threshold) {
          navigateNext();
        }
        // Small delay to ensure click handlers don't fire after drag ends
        setTimeout(() => { isDraggingRef.current = false; }, 50);
      }}
      className="flex flex-col flex-1 min-h-0 cursor-grab active:cursor-grabbing touch-pan-y select-none"
    >
      <div
        className="grid border-b border-indigo-100 bg-indigo-50/80 backdrop-blur-sm z-10"
        style={{
          gridTemplateColumns: '64px 1fr',
          scrollbarGutter: 'stable'
        }}
      >
        <div className="p-2 border-r border-gray-100" />
        <div className="p-2 text-center">
          <div className="text-xs text-indigo-600 font-bold uppercase">
            {format(currentDate, 'EEEE')}
          </div>
          <div className="text-lg sm:text-2xl font-bold mt-1 text-blue-500">
            {format(currentDate, 'd')}
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto custom-scrollbar touch-pan-y"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="flex flex-col">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-blue-100/50 min-h-[64px]"
              style={{ gridTemplateColumns: '64px 1fr' }}
            >
              <div className="p-1 sm:p-2 text-xs sm:text-sm text-gray-400 text-right pr-2 sm:pr-4 border-r border-blue-100/50 whitespace-nowrap">
                {format(setMinutes(setHours(new Date(), hour), 0), 'h a')}
              </div>

              <div
                onClick={() => {
                  if (isDraggingRef.current) return;
                  const clickedDateTime = setMinutes(setHours(currentDate, hour), 0);
                  onDateClick(clickedDateTime, true);
                }}
                className="p-1 hover:bg-blue-50/30 cursor-pointer transition-colors relative min-w-0"
              >
                {getEventsForDate(currentDate)
                  .filter(event => {
                    if (event.isAllDay) return hour === 0;
                    const eventHour = parseInt(event.startTime.split(':')[0]);
                    return eventHour === hour;
                  })
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDraggingRef.current) return;
                        onEventView(event);
                      }}
                      className="text-xs sm:text-sm p-2 rounded-lg truncate cursor-pointer hover:shadow-md mb-1 border-l-4 shadow-sm"
                      style={{
                        backgroundColor: `${event.color}15`,
                        color: event.color,
                        borderColor: event.color
                      }}
                    >
                      <div className="font-bold truncate">{event.title}</div>
                      <div className="text-[10px] opacity-80">
                        {event.isAllDay ? 'All Day' : `${event.startTime} - ${event.endTime}`}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Month View Component
  const MonthView = () => (
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onDragStart={() => { isDraggingRef.current = true; }}
      onDragEnd={(_, info) => {
        const threshold = 30;
        if (info.offset.x > threshold) {
          navigatePrev();
        } else if (info.offset.x < -threshold) {
          navigateNext();
        }
        setTimeout(() => { isDraggingRef.current = false; }, 50);
      }}
      className="flex flex-col flex-1 min-h-0 overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-indigo-100 bg-indigo-50/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
          <div
            key={day}
            className={`
              py-3 text-center text-xs font-bold uppercase tracking-wider
              ${idx === 0 || idx === 6 ? 'text-indigo-400' : 'text-indigo-600'}
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
          const isTodayDate = isToday(date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.005 }}
              onClick={() => {
                if (isDraggingRef.current) return;
                onDateClick(date, false);
              }}
              className={`
                p-1 sm:p-2 border-r border-b border-blue-100/50 last:border-r-0 flex flex-col min-h-0 overflow-hidden
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
                    ${isTodayDate
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
                      if (isDraggingRef.current) return;
                      onDayViewOpen(date);
                    }}
                    className="cursor-pointer flex-shrink-0 min-w-0"
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
                      if (isDraggingRef.current) return;
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
    </motion.div>
  );

  // Week View Component
  const WeekView = () => (
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      onDragStart={() => { isDraggingRef.current = true; }}
      onDragEnd={(_, info) => {
        const threshold = 30;
        if (info.offset.x > threshold) {
          navigatePrev();
        } else if (info.offset.x < -threshold) {
          navigateNext();
        }
        setTimeout(() => { isDraggingRef.current = false; }, 50);
      }}
      className="flex flex-col flex-1 min-h-0 cursor-grab active:cursor-grabbing touch-pan-y select-none"
    >
      {/* Header with days - Fixed at top */}
      <div
        className="grid border-b border-indigo-100 bg-indigo-50/80 backdrop-blur-sm z-10"
        style={{
          gridTemplateColumns: 'minmax(45px, 1fr) repeat(7, 2fr)',
          scrollbarGutter: 'stable'
        }}
      >
        <div className="p-2 border-r border-gray-100" /> {/* Time column header */}
        {weekData.map((date) => {
          const isTodayDate = isToday(date);
          return (
            <div
              key={date.toISOString()}
              onClick={() => {
                setCurrentDate(date);
                setViewMode('day');
              }}
              className="p-2 text-center border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-white/40 transition-colors"
            >
              <div className="text-xs text-indigo-600 font-bold uppercase">
                {format(date, 'EEE')}
              </div>
              <div
                className={`
                  text-lg sm:text-xl font-semibold mt-1
                  ${isTodayDate ? 'text-blue-500' : 'text-gray-900'}
                `}
              >
                {format(date, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Grid - Scrollable area */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar touch-pan-y"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="flex flex-col">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-blue-100/50 min-h-[48px]"
              style={{ gridTemplateColumns: 'minmax(45px, 1fr) repeat(7, 2fr)' }}
            >
              {/* Time Label */}
              <div className="p-0.5 sm:p-1 text-[11px] sm:text-xs text-gray-400 text-right pr-1 sm:pr-2 border-r border-blue-100/50 whitespace-nowrap">
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
                      if (isDraggingRef.current) return;
                      const clickedDateTime = setMinutes(setHours(date, hour), 0);
                      onDateClick(clickedDateTime, true);
                    }}
                    className="border-r border-gray-100 last:border-r-0 p-0.5 hover:bg-blue-50/30 cursor-pointer transition-colors relative min-w-0 overflow-hidden"
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isDraggingRef.current) return;
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
    </motion.div>
  );

  // Heatmap color helper
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-blue-200';
    if (count === 2) return 'bg-blue-300';
    if (count === 3) return 'bg-blue-400';
    if (count === 4) return 'bg-blue-500';
    return 'bg-blue-700';
  };

  // Year View Component
  const YearView = () => {
    const year = getYear(currentDate);
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    return (
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={(_, info) => {
          const threshold = 30;
          if (info.offset.x > threshold) {
            navigatePrev();
          } else if (info.offset.x < -threshold) {
            navigateNext();
          }
          setTimeout(() => { isDraggingRef.current = false; }, 50);
        }}
        className="flex flex-col flex-1 min-h-0 cursor-grab active:cursor-grabbing touch-pan-y select-none"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 lg:p-6 flex flex-col touch-pan-y">
          {/* 12-Month Grid — stretches to fill available space */}
          <div
            className={`grid gap-4 sm:gap-5 lg:gap-6 flex-1 ${isSidebarOpen
              ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              }`}
            style={{ gridAutoRows: '1fr' }}
          >
            {months.map((monthDate, monthIndex) => {
              const mStart = startOfMonth(monthDate);
              const mEnd = endOfMonth(monthDate);
              const calStart = startOfWeek(mStart, { weekStartsOn: 0 });
              const calEnd = endOfWeek(mEnd, { weekStartsOn: 0 });
              const days = eachDayOfInterval({ start: calStart, end: calEnd });

              return (
                <motion.div
                  key={monthIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: monthIndex * 0.03 }}
                  className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl border border-blue-100/60 shadow-sm p-3 sm:p-4 hover:shadow-lg hover:border-blue-200/80 transition-all duration-200 flex flex-col"
                >
                  {/* Month Name */}
                  <button
                    onClick={() => {
                      setCurrentDate(monthDate);
                      setViewMode('month');
                    }}
                    className="text-sm sm:text-base font-bold text-gray-800 mb-2 sm:mb-3 hover:text-blue-600 transition-colors cursor-pointer w-full text-left flex-shrink-0"
                  >
                    {format(monthDate, 'MMMM')}
                  </button>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 mb-1 sm:mb-1.5 flex-shrink-0">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-[9px] sm:text-[10px] font-semibold text-gray-400 uppercase">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day Grid with Heatmap — grows to fill card */}
                  <div className="grid grid-cols-7 gap-[2px] sm:gap-1 flex-1 content-start">
                    {days.map((date, dayIndex) => {
                      const inMonth = isSameMonth(date, monthDate);
                      const eventCount = inMonth ? getEventsForDate(date).length : 0;
                      const isTodayDate = isToday(date);

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => {
                            if (isDraggingRef.current) return;
                            if (inMonth) {
                              setCurrentDate(date);
                              setViewMode('day');
                            }
                          }}
                          className={`
                          w-full aspect-square rounded sm:rounded-md text-[8px] sm:text-[10px] lg:text-[11px] font-medium flex items-center justify-center transition-all relative
                          ${!inMonth
                              ? 'opacity-0 pointer-events-none'
                              : `${getHeatmapColor(eventCount)} hover:opacity-80 hover:scale-110 cursor-pointer`
                            }
                          ${eventCount > 0 && inMonth ? 'text-white font-semibold' : 'text-gray-500'}
                        `}
                          title={inMonth ? `${format(date, 'MMM d')} - ${eventCount} event${eventCount !== 1 ? 's' : ''}` : ''}
                        >
                          {inMonth && (
                            <>
                              {isTodayDate && (
                                <div className="absolute inset-0 border-2 border-blue-600 rounded sm:rounded-md pointer-events-none z-10" />
                              )}
                              <span className="relative z-0">{format(date, 'd')}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 mt-5 sm:mt-8 pb-3 flex-shrink-0">
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Less</span>
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${getHeatmapColor(level)}`}
                title={level === 0 ? '0 events' : level === 5 ? '5+ events' : `${level} event${level !== 1 ? 's' : ''}`}
              />
            ))}
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">More</span>
          </div>
        </div>
      </motion.div>
    );
  };


  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-200/60 overflow-hidden h-full flex flex-col relative">
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

            <h2 className="text-base sm:text-xl font-bold flex-1 text-center whitespace-nowrap truncate px-1 relative group cursor-pointer"
              onClick={() => setIsSelectorOpen(true)}
            >
              <motion.span
                whileHover={{ scale: 1.02, color: '#3b82f6' }}
                whileTap={{ scale: 0.98 }}
                className="inline-block text-gray-900 transition-colors duration-200"
              >
                {viewMode === 'day'
                  ? format(currentDate, 'EEEE, MMMM d')
                  : viewMode === 'month'
                    ? format(currentDate, 'MMMM yyyy')
                    : viewMode === 'week'
                      ? `${format(startOfWeek(currentDate), 'MMMM d')}`
                      : format(currentDate, 'yyyy')
                }
              </motion.span>
            </h2>

            {/* Inline Today indicator */}
            {((viewMode === 'year' && getYear(currentDate) !== getYear(new Date())) ||
              (viewMode !== 'year' && format(currentDate, 'yyyy-MM') !== format(new Date(), 'yyyy-MM'))) && (
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
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('year')}
              className={`
                p-1.5 sm:px-3 sm:py-1 rounded-full transition-all flex items-center space-x-1
                ${viewMode === 'year'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
                }
              `}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Year</span>
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
          {viewMode === 'day' ? <DayView /> : viewMode === 'month' ? <MonthView /> : viewMode === 'week' ? <WeekView /> : <YearView />}
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
            className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-lg hover:shadow-xl transition-all z-30 flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
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
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
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
      <DateSelectorPopup
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        currentDate={currentDate}
        onSelectDate={setCurrentDate}
        viewMode={viewMode}
      />
    </div>
  );
};

export default CalendarView;

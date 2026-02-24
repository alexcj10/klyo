import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Event } from '../types';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  events?: Event[]; // Add events prop for searching
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const containerVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0, y: -20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 25 }
  },
  exit: { scale: 0.95, opacity: 0, y: 20 }
};

const SearchOverlay: React.FC<SearchOverlayProps> = ({ open, onClose, onSearch, events = [] }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [foundEvents, setFoundEvents] = useState<Event[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const handleClose = () => {
    setQuery('');
    setFoundEvents([]);
    setNotFound(false);
    setExpandedEvents(new Set());
    onClose();
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Smart date parsing function
  const parseSearchQuery = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Month names mapping
    const monthNames = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8, 'sept': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };

    // Day names mapping
    const dayNames = {
      'sunday': 0, 'sun': 0,
      'monday': 1, 'mon': 1,
      'tuesday': 2, 'tue': 2, 'tues': 2,
      'wednesday': 3, 'wed': 3,
      'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
      'friday': 5, 'fri': 5,
      'saturday': 6, 'sat': 6
    };

    // Check for "day month" pattern (e.g., "24 july", "july 24")
    const dayMonthPattern = /^(\d{1,2})\s+(\w+)$|^(\w+)\s+(\d{1,2})$/;
    const dayMonthMatch = normalizedQuery.match(dayMonthPattern);
    if (dayMonthMatch) {
      const [, day1, month1, month2, day2] = dayMonthMatch;
      const day = parseInt(day1 || day2);
      const monthName = month1 || month2;
      const monthIndex = monthNames[monthName as keyof typeof monthNames];

      if (monthIndex !== undefined && day >= 1 && day <= 31) {
        return {
          type: 'date' as const,
          targetDate: new Date(currentYear, monthIndex, day)
        };
      }
    }

    // Check for day name (e.g., "monday", "tuesday")
    const dayIndex = dayNames[normalizedQuery as keyof typeof dayNames];
    if (dayIndex !== undefined) {
      return {
        type: 'dayOfWeek' as const,
        dayOfWeek: dayIndex,
        month: currentMonth,
        year: currentYear
      };
    }

    // Check for month name (e.g., "july", "december")
    const monthIndex = monthNames[normalizedQuery as keyof typeof monthNames];
    if (monthIndex !== undefined) {
      return {
        type: 'month' as const,
        month: monthIndex,
        year: currentYear
      };
    }

    // Check for day number only (e.g., "23", "19", "6")
    const dayNumber = parseInt(normalizedQuery);
    if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
      return {
        type: 'dayNumber' as const,
        day: dayNumber,
        month: currentMonth,
        year: currentYear
      };
    }

    // Default: search by title
    return {
      type: 'title' as const,
      query: normalizedQuery
    };
  };

  // Enhanced search function
  const searchEvents = (query: string): Event[] => {
    const searchParams = parseSearchQuery(query);

    switch (searchParams.type) {
      case 'date':
        return events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getFullYear() === searchParams.targetDate.getFullYear() &&
            eventDate.getMonth() === searchParams.targetDate.getMonth() &&
            eventDate.getDate() === searchParams.targetDate.getDate();
        });

      case 'dayOfWeek':
        return events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getDay() === searchParams.dayOfWeek &&
            eventDate.getMonth() === searchParams.month &&
            eventDate.getFullYear() === searchParams.year;
        });

      case 'month':
        return events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === searchParams.month &&
            eventDate.getFullYear() === searchParams.year;
        });

      case 'dayNumber':
        return events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getDate() === searchParams.day &&
            eventDate.getMonth() === searchParams.month &&
            eventDate.getFullYear() === searchParams.year;
        });

      case 'title':
      default:
        return events.filter(event =>
          event.title.toLowerCase().includes(searchParams.query)
        );
    }
  };

  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      // Focus after overlay appears
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => {
        clearTimeout(t);
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.overscrollBehavior = '';
      };
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
    // handleClose is now a dependency
  }, [open, handleClose]);

  // Reset preview when query changes
  useEffect(() => {
    setFoundEvents([]);
    setNotFound(false);
    onSearch(query);
  }, [query, onSearch]);

  // Handle Enter key to search for events with smart date parsing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      // Use smart search function
      const matchingEvents = searchEvents(query.trim());

      if (matchingEvents.length > 0) {
        setFoundEvents(matchingEvents);
        setNotFound(false);
      } else {
        setFoundEvents([]);
        setNotFound(true);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
          />

          {/* Centered container */}
          <motion.div
            variants={containerVariants}
            className="relative z-10 w-[90vw] max-w-2xl"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search events…"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/70 backdrop-blur-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base md:text-lg shadow-xl placeholder-gray-500"
              />
              <button
                onClick={handleClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Preview Section */}
            {(foundEvents.length > 0 || notFound) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full"
              >
                {foundEvents.length > 0 && (
                  <div
                    className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:hidden overscroll-contain"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {foundEvents.length > 1 && (
                      <div className="text-sm text-gray-600 font-medium mb-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-gray-100">
                        Found {foundEvents.length} events matching "{query}"
                      </div>
                    )}
                    {foundEvents.map((event, index) => {
                      const isExpanded = expandedEvents.has(event.id);
                      const hasLongDescription = event.description && event.description.length > 150;

                      return (
                        <div key={`${event.id}-${index}`} className="p-3 sm:p-4 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
                          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                            <h4 className="font-bold text-base sm:text-lg md:text-xl text-gray-800 flex-1 min-w-0 truncate pr-2" title={event.title}>{event.title}</h4>
                            <div className="flex gap-2 flex-shrink-0">
                              <span className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${event.priority === 'high' ? 'bg-red-100 text-red-700' :
                                event.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                {event.priority}
                              </span>
                              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 whitespace-nowrap">
                                {event.category}
                              </span>
                            </div>
                          </div>
                          <div className="text-gray-600 mb-2">
                            📅 {event.date.toLocaleDateString()} at {event.startTime} - {event.endTime}
                          </div>
                          {event.description && (
                            <div className="text-gray-700">
                              <div className={`whitespace-pre-wrap ${hasLongDescription && !isExpanded ? 'line-clamp-3' : ''}`}>
                                {isExpanded || !hasLongDescription ? event.description : truncateText(event.description)}
                              </div>
                              {hasLongDescription && (
                                <button
                                  onClick={() => toggleEventExpansion(event.id)}
                                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
                                >
                                  {isExpanded ? 'Read less' : 'Read more'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {notFound && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 shadow-lg">
                    <div className="text-red-600 font-semibold text-center">
                      ❌ Couldn't find any events matching "{query}"
                    </div>
                    <div className="text-red-500 text-sm text-center mt-1">
                      Try searching with different keywords
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
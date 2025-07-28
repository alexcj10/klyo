import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import TaskSidebar from './components/TaskSidebar';
import EventModal from './components/EventModal';
import EventViewModal from './components/EventViewModal';
import DayViewModal from './components/DayViewModal';
import { Event, Task } from './types';
import { mockEvents, mockTasks } from './data/mockData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getNextColor } from './utils/colorPalette';

// --------- Import the latest SplashScreen -----------
import SplashScreen from './components/SplashScreen'; // <-- Make sure this is the new file

function App() {
  // Splash state
  const [showSplash, setShowSplash] = useState(true);

  const [events, setEvents] = useLocalStorage<Event[]>('klyo-events', mockEvents);
  
  // EMERGENCY: Function to restore events if they disappear
  const restoreEvents = () => {
    console.log('Restoring events from mock data...');
    setEvents(mockEvents);
    console.log('Events restored!');
  };
  
  // EMERGENCY: Auto-restore if events are empty
  React.useEffect(() => {
    if (events.length === 0) {
      console.log('No events found, auto-restoring...');
      restoreEvents();
    }
  }, []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('klyo-tasks', mockTasks);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventViewModalOpen, setIsEventViewModalOpen] = useState(false);
  const [isDayViewModalOpen, setIsDayViewModalOpen] = useState(false);
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);
  const [showSadAnimation, setShowSadAnimation] = useState(false);

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery) {
      return events;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(lowercasedQuery) ||
        (event.description && event.description.toLowerCase().includes(lowercasedQuery)) ||
        event.category.toLowerCase().includes(lowercasedQuery)
    );
  }, [events, searchQuery]);

  // Event Handlers (untouched)
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsDayViewModalOpen(false);
    setIsEventViewModalOpen(false);
    setIsEventModalOpen(true);
  };

  const handleEventView = (event: Event) => {
    setViewEvent(event);
    setIsEventViewModalOpen(true);
  };

  // Navigation handler for EventViewModal
  const handleEventNavigation = (direction: 'prev' | 'next') => {
    if (!viewEvent) return;
    
    // Get events from the same month as the current viewed event
    const currentEventDate = viewEvent.date;
    const currentMonth = currentEventDate.getMonth();
    const currentYear = currentEventDate.getFullYear();
    
    const monthEvents = filteredEvents
      .filter(event => 
        event.date.getMonth() === currentMonth && 
        event.date.getFullYear() === currentYear
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const currentIndex = monthEvents.findIndex(e => e.id === viewEvent.id);
    
    if (direction === 'prev' && currentIndex > 0) {
      setViewEvent(monthEvents[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < monthEvents.length - 1) {
      setViewEvent(monthEvents[currentIndex + 1]);
    }
  };

  // Get current month events for navigation
  const getCurrentMonthEvents = () => {
    if (!viewEvent) return [];
    
    const currentEventDate = viewEvent.date;
    const currentMonth = currentEventDate.getMonth();
    const currentYear = currentEventDate.getFullYear();
    
    return filteredEvents
      .filter(event => 
        event.date.getMonth() === currentMonth && 
        event.date.getFullYear() === currentYear
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handleDateClick = (date: Date) => {
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(clickedDate);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setIsEventModalOpen(true);
  };

  const handleEventSave = (eventData: Omit<Event, 'id'>) => {
    if (selectedEvent) {
      setEvents(
        events.map((event) =>
          event.id === selectedEvent.id ? { ...eventData, id: selectedEvent.id, color: selectedEvent.color } : event
        )
      );
    } else {
      const nextColor = getNextColor(events);
      const newEvent: Event = {
        ...eventData,
        color: nextColor,
        id: Date.now().toString(),
      };
      setEvents([...events, newEvent]);
    }
  };

  const handleEventDelete = (eventId: string) => {
    const eventToDelete = events.find((event) => event.id === eventId);
    if (eventToDelete) {
      setEvents(events.filter((event) => event.id !== eventId));
      setShowSadAnimation(true);
      setTimeout(() => {
        setShowSadAnimation(false);
      }, 3000);
    }
  };

  const handleDayViewOpen = (date: Date) => {
    setDayViewDate(date);
    setIsDayViewModalOpen(true);
  };

  const handleDayViewEventClick = (event: Event) => {
    setIsDayViewModalOpen(false);
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsEventModalOpen(true);
  };

  const handleDayViewAddEvent = (date: Date) => {
    setIsDayViewModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(date);
    setIsEventModalOpen(true);
  };

  const handleTaskComplete = (taskId: string) => {
    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleTaskAdd = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const handleModalClose = () => {
    setIsEventModalOpen(false);
    setIsEventViewModalOpen(false);
    setDeleteConfirmEvent(null);
    setSelectedEvent(null);
    setViewEvent(null);
    setSelectedDate(null);
  };

  const handleDayViewModalClose = () => {
    setIsDayViewModalOpen(false);
    setDayViewDate(null);
  };

  const handleDeleteWithConfirm = (event: Event) => {
    setDeleteConfirmEvent(event);
  };

  const confirmDelete = () => {
    if (deleteConfirmEvent) {
      handleEventDelete(deleteConfirmEvent.id);
      setDeleteConfirmEvent(null);
      setIsEventModalOpen(false);
    }
  };

  // Render splash while it shows
  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  // --------- MAIN APP UI ---------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <Header
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onToggleDesktopSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onSearch={setSearchQuery}
        events={events} // Pass events data for search functionality
      />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 flex overflow-hidden relative"
      >
        <div
          className={`flex-1 min-w-0 p-4 lg:p-6 transition-all duration-300 ${
            isSidebarOpen ? 'lg:mr-80 xl:mr-96' : 'lg:mr-0'
          }`}
        >
          <CalendarView
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onEventView={handleEventView}
            onAddEvent={handleAddEvent}
            onDayViewOpen={handleDayViewOpen}
            onEventDelete={(event) => handleEventDelete(event.id)}
          />
        </div>

        <motion.div
          initial={false}
          animate={{
            x: isSidebarOpen ? 0 : '100%',
            opacity: isSidebarOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden lg:block fixed right-0 top-16 bottom-0 w-80 xl:w-96 bg-white/95 backdrop-blur-sm border-l border-gray-200/50 shadow-lg z-30 overflow-hidden"
        >
          <TaskSidebar
            tasks={tasks}
            onTaskComplete={handleTaskComplete}
            onTaskAdd={handleTaskAdd}
            onTaskDelete={handleTaskDelete}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onEventView={handleEventView}
            onEventDelete={(event) => handleEventDelete(event.id)}
          />
        </motion.div>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <TaskSidebar
                  tasks={tasks}
                  onTaskComplete={handleTaskComplete}
                  onTaskAdd={handleTaskAdd}
                  onTaskDelete={handleTaskDelete}
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  onEventView={handleEventView}
                  onEventDelete={(event) => handleEventDelete(event.id)}
                  onClose={() => setIsMobileSidebarOpen(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* Sidebar toggle button (desktop) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`hidden lg:block fixed top-1/2 -translate-y-1/2 z-40 bg-white shadow-lg border border-gray-200/50 rounded-l-xl p-3 transition-all duration-300 ${
          isSidebarOpen ? 'right-80 xl:right-96' : 'right-0'
        }`}
      >
        <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }} transition={{ duration: 0.3 }}>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </motion.div>
      </motion.button>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={handleModalClose}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        event={selectedEvent || undefined}
        selectedDate={selectedDate || undefined}
        events={events}
        deleteConfirmEvent={deleteConfirmEvent}
        onDeleteWithConfirm={handleDeleteWithConfirm}
        onConfirmDelete={confirmDelete}
        onCancelDelete={() => setDeleteConfirmEvent(null)}
      />

      <EventViewModal
        isOpen={isEventViewModalOpen}
        onClose={() => setIsEventViewModalOpen(false)}
        event={viewEvent}
        onEdit={handleEventClick}
        onDelete={(event) => handleEventDelete(event.id)}
        allEvents={getCurrentMonthEvents()}
        onNavigate={handleEventNavigation}
      />

      <DayViewModal
        isOpen={isDayViewModalOpen}
        onClose={handleDayViewModalClose}
        date={dayViewDate}
        events={filteredEvents.filter(
          (event) => dayViewDate && event.date.toDateString() === dayViewDate.toDateString()
        )}
        onEventClick={handleDayViewEventClick}
        onEventDelete={(event) => handleEventDelete(event.id)}
        onAddEvent={handleDayViewAddEvent}
      />

      {/* Sad animation on event delete */}
      <AnimatePresence>
        {showSadAnimation && (
          <motion.div
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-800 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
                Event Deleted!
              </h1>
              <p className="text-2xl md:text-3xl text-white/95 font-medium">Your event has been removed</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

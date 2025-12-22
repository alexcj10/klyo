import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Clock, Plus, Calendar, Trash2, Edit3, List, AlertCircle } from 'lucide-react';
import { Task, Event } from '../types';
import { format } from 'date-fns';

interface TaskSidebarProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskAdd: (task: Omit<Task, 'id'>) => void;
  onTaskDelete: (taskId: string) => void;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventView: (event: Event) => void;
  onEventDelete: (event: Event) => void;
}

const TaskSidebar: React.FC<TaskSidebarProps> = ({
  tasks,
  onTaskComplete,
  onTaskAdd,
  onTaskDelete,
  events,
  onEventClick,
  onEventView,
  onEventDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'events'>('tasks');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTaskCategory, setNewTaskCategory] = useState<Task['category']>('personal');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'category'>('priority');
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);
  // Removed isSorting state as sorting is now instant with useMemo

  const sortedAndFilteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (filter === 'pending') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const getPriorityValue = (priority: Task['priority'] | undefined | null) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priority ? priorityOrder[priority] : 0;
      };

      let comparison = 0;

      if (sortBy === 'priority') {
        const priorityA = getPriorityValue(a.priority);
        const priorityB = getPriorityValue(b.priority);
        comparison = priorityB - priorityA; // Descending order (High first)
      } else if (sortBy === 'date') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity; // Infinity pushes tasks without dates to the end
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB; // Ascending order
      } else if (sortBy === 'category') {
        const categoryA = a.category || '';
        const categoryB = b.category || '';
        comparison = categoryA.localeCompare(categoryB); // Alphabetical
      }

      // Secondary sorting: by title for consistent order if primary sort values are equal
      if (comparison === 0) {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB);
      }

      return comparison;
    });

    return sorted;
  }, [tasks, filter, sortBy]);

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

  const upcomingEvents = events
    .filter(event => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today's date to start of day
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      weekFromNow.setHours(23, 59, 59, 999); // Normalize to end of day

      // Ensure event.date is treated as a Date object for comparison
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);

      return eventDate >= today && eventDate <= weekFromNow;
    })
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return dateA - dateB;
    });


  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onTaskAdd({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        completed: false,
        category: newTaskCategory,
        dueDate: new Date(newTaskDate),
      });
      setNewTaskTitle('');
      setNewTaskDate(new Date().toISOString().split('T')[0]);
      setIsAddingTask(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-600 bg-red-50 border-red-200 shadow-red-100',
      medium: 'text-amber-600 bg-amber-50 border-amber-200 shadow-amber-100',
      low: 'text-emerald-600 bg-emerald-50 border-emerald-200 shadow-emerald-100'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertCircle className="w-3 h-3" />;
    if (priority === 'medium') return <Clock className="w-3 h-3" />;
    return <Circle className="w-3 h-3" />;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      work: '💼',
      personal: '🏠',
      health: '🏃‍♂️',
      social: '👥',
      other: '📝'
    };
    return icons[category as keyof typeof icons] || icons.other;
  };

  const getCategoryColorClass = (category: string) => {
    const colors = {
      work: 'text-blue-700 bg-blue-50 border-blue-200',
      personal: 'text-purple-700 bg-purple-50 border-purple-200',
      health: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      social: 'text-orange-700 bg-orange-50 border-orange-200',
      other: 'text-gray-700 bg-gray-50 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  };

  const stats = getTaskStats();

  return (
    <div className="h-full pt-16 lg:pt-0 bg-gradient-to-br from-white via-gray-50/50 to-indigo-50/30 backdrop-blur-sm overflow-hidden flex flex-col relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/20 to-purple-100/20 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/20 to-cyan-100/20 rounded-full translate-y-12 -translate-x-12 blur-2xl"></div>

      {/* Header */}
      <div className="px-3.5 pt-3.5 pb-3.5 flex-shrink-0 border-b border-gray-200/40 bg-white/80 backdrop-blur-md relative z-10">

        {/* Stats Bar for Tasks */}
        {activeTab === 'tasks' && tasks.length > 0 && (
          <div className="mb-3 p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between text-[11px] sm:text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-gray-500 font-medium">Progress</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-1 bg-gray-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                  <span className="text-indigo-600 font-bold">{stats.completionRate}%</span>
                </div>
              </div>
              <span className="text-gray-400 font-medium">{stats.completed}/{stats.total}</span>
            </div>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex space-x-1 mb-4 bg-gray-100/80 rounded-xl p-1 backdrop-blur-sm">
          {[
            { key: 'tasks', label: 'Tasks', count: tasks.length, icon: List },
            { key: 'events', label: 'Events', count: upcomingEvents.length, icon: Calendar }
          ].map(({ key, label, count, icon: Icon }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`
                px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex-1 flex items-center justify-center space-x-2
                ${activeTab === key
                  ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10 border border-indigo-100'
                  : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${activeTab === key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Filter and Sort Controls for Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {/* Filter Buttons */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All', count: tasks.length },
                { key: 'pending', label: 'Pending', count: tasks.filter(t => !t.completed).length },
                { key: 'completed', label: 'Done', count: tasks.filter(t => t.completed).length }
              ].map(({ key, label, count }) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFilter(key as typeof filter)}
                  className={`
                    px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex-1 text-center border
                    ${filter === key
                      ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm'
                      : 'bg-white/50 text-gray-500 border-gray-100 hover:bg-white hover:text-gray-700'
                    }
                  `}
                >
                  {label} ({count})
                </motion.button>
              ))}
            </div>

            {/* Sort Dropdown and Add Task Button */}
            {tasks.length > 0 && (
              <div className="flex items-center space-x-2 pt-1">
                <div className="flex flex-1 items-center bg-gray-100/50 rounded-lg border border-gray-200/50 px-2 py-1.5 h-[34px]">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-2">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-transparent text-[11px] font-bold text-gray-700 focus:outline-none w-full appearance-none cursor-pointer"
                  >
                    <option value="priority">Priority</option>
                    <option value="date">Date</option>
                    <option value="category">Category</option>
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAddingTask(true)}
                  className="flex-shrink-0 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-[11px] font-bold flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tasks/Events List and Add Form */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-5 pb-4 scrollbar-hide overscroll-contain">
        {/* Add Task Form */}
        <AnimatePresence>
          {isAddingTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-gray-200/30 bg-gradient-to-br from-white to-gray-50/50 rounded-xl mb-4 shadow-sm relative z-20"
            >
              <div className="p-4 space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        setNewTaskTitle(e.target.value);
                      }
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    maxLength={100}
                    className="w-full px-3.5 py-2 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 text-sm bg-white/80 backdrop-blur-sm placeholder-gray-400 transition-all duration-200"
                    autoFocus
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${newTaskTitle.length > 90 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                      {newTaskTitle.length}/100
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Due Date</label>
                    <input
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as Task['category'])}
                    className="px-2 py-2 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 text-xs bg-white/80 backdrop-blur-sm min-w-0"
                  >
                    <option value="work">💼 Work</option>
                    <option value="personal">🏠 Personal</option>
                    <option value="health">🏃‍♂️ Health</option>
                    <option value="social">👥 Social</option>
                    <option value="other">📝 Other</option>
                  </select>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                    className="px-2 py-2 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 text-xs bg-white/80 backdrop-blur-sm min-w-0"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddTask}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm font-bold text-xs"
                  >
                    Add Task
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTaskTitle('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-500 bg-white rounded-lg hover:bg-gray-50 font-bold text-xs"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <AnimatePresence mode="popLayout">
                {sortedAndFilteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden"
                  >
                    {/* Priority accent line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></div>

                    <div className="flex items-start space-x-3 pl-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onTaskComplete(task.id)}
                        className="mt-1 text-gray-400 hover:text-indigo-500 transition-colors duration-200 flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </motion.button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`
                            font-semibold text-sm leading-relaxed
                            ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}
                          `}>
                            {task.title}
                          </h4>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onTaskDelete(task.id)}
                              className="text-red-400 hover:text-red-600 transition-colors duration-200 p-1.5 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`
                              px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center space-x-1
                              ${getPriorityColor(task.priority || 'low')}
                            `}>
                              {getPriorityIcon(task.priority || 'low')}
                              <span className="capitalize">{task.priority || 'low'}</span>
                            </span>
                            <span className="text-base">
                              {getCategoryIcon(task.category || 'other')}
                            </span>
                            {task.estimatedTime && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                <Clock className="w-3 h-3" />
                                <span>{task.estimatedTime}m</span>
                              </div>
                            )}
                          </div>
                          {task.dueDate && (() => {
                            const d = new Date(task.dueDate);
                            const today = new Date();
                            const tomorrow = new Date(today);
                            tomorrow.setDate(today.getDate() + 1);

                            let label = format(d, 'MMM d');
                            if (d.toDateString() === today.toDateString()) label = "Today";
                            else if (d.toDateString() === tomorrow.toDateString()) label = "Tomorrow";

                            const isOverdue = !task.completed && d < today && d.toDateString() !== today.toDateString();

                            return (
                              <div className={`flex items-center space-x-1 text-[10px] sm:text-xs px-2 py-1 rounded-lg border ${isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                }`}>
                                <Calendar className="w-3 h-3" />
                                <span className="font-medium">{label}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'events' && (
          /* Events List */
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Color accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: event.color }}
                  ></div>

                  <div className="p-4 pl-6">
                    <div className="flex items-start space-x-3 cursor-pointer" onClick={() => onEventView(event)}>
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 border-2 border-white shadow-lg"
                        style={{ backgroundColor: event.color }}
                      ></div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm leading-relaxed text-gray-800">
                            {event.title}
                          </h4>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick(event);
                              }}
                              className="text-indigo-500 hover:text-indigo-700 transition-colors duration-200 p-1.5 hover:bg-indigo-50 rounded-lg"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(event);
                              }}
                              className="text-red-400 hover:text-red-600 transition-colors duration-200 p-1.5 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                            {event.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className={`
                              px-2.5 py-1 rounded-lg text-xs font-semibold border
                              ${getCategoryColorClass(event.category)}
                            `}>
                              {event.category}
                            </span>
                            {event.isAllDay ? (
                              <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                <Clock className="w-3 h-3" />
                                <span>All day</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                <Clock className="w-3 h-3" />
                                <span>{event.startTime}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span>{format(event.date, 'MMM d')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty States */}
        {((activeTab === 'tasks' && sortedAndFilteredTasks.length === 0) || (activeTab === 'events' && upcomingEvents.length === 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 lg:py-16"
          >
            {activeTab === 'tasks' ? (
              <>
                <motion.div
                  className="text-6xl lg:text-7xl mb-6"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  📝
                </motion.div>
                <h3 className="font-bold text-gray-800 text-xl mb-2">
                  {filter === 'all' && 'No tasks added yet'}
                  {filter === 'pending' && 'No pending tasks'}
                  {filter === 'completed' && 'No completed tasks'}
                </h3>
                <p className="text-sm text-gray-500 mb-6 px-4 leading-relaxed">
                  {filter === 'all' && 'Start organizing your day by adding your first task'}
                  {filter === 'pending' && 'All caught up! Great job staying on top of things.'}
                  {filter === 'completed' && 'Complete some tasks to see them here'}
                </p>
                {filter === 'all' && (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAddingTask(true)}
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 text-sm font-semibold flex items-center space-x-3 mx-auto group"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Add Your First Task</span>
                  </motion.button>
                )}
              </>
            ) : (
              <>
                <motion.div
                  className="text-6xl lg:text-7xl mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  📅
                </motion.div>
                <h3 className="font-bold text-gray-800 text-xl mb-2">No upcoming events</h3>
                <p className="text-sm text-gray-500 px-4 mb-4 leading-relaxed">
                  No events scheduled for the next 7 days. Add some events to your calendar!
                </p>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-5 max-w-[320px] w-full mx-auto overflow-hidden border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-4">
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
    </div>
  );
};

export default TaskSidebar;
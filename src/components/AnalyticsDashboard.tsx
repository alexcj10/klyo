import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';
import { Calendar, CheckCircle, Clock, TrendingUp, BarChart3, PieChart as PieChartIcon, Target, Activity, Zap, Award } from 'lucide-react';
import { Event, Task } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

interface AnalyticsDashboardProps {
  events: Event[];
  tasks: Task[];
  onAddEvent?: () => void;
  onAddTask?: () => void;
}

const COLORS = {
  primary: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
  secondary: ['#06B6D4', '#67E8F9', '#A5F3FC', '#CFFAFE', '#ECFEFF'],
  accent: ['#F59E0B', '#FCD34D', '#FDE68A', '#FEF3C7', '#FFFBEB'],
  success: ['#10B981', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#ECFDF5'],
  danger: ['#EF4444', '#FCA5A5', '#FECACA', '#FEE2E2', '#FEF2F2'],
  gradient: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
  advanced: {
    purple: ['#6366F1', '#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE'],
    blue: ['#0EA5E9', '#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC'],
    green: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
    orange: ['#EA580C', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'],
    red: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'],
  },
  categoryColors: {
    work: '#6366F1',
    personal: '#10B981',
    health: '#F59E0B',
    social: '#EC4899',
    other: '#8B5CF6',
  },
  priorityColors: {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  },
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ events, tasks, onAddEvent, onAddTask }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');
  const [activeChart, setActiveChart] = useState<string | null>(null);

  // Calculate advanced analytics data with real-time sync and empty state handling
  const analytics = useMemo(() => {
    // Check if we have any data at all
    const hasEvents = events.length > 0;
    const hasTasks = tasks.length > 0;

    // Enhanced category analysis with colors - FIXED for empty states
    const eventsByCategory = hasEvents ? Object.entries(
      events.reduce((acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS.categoryColors[name as keyof typeof COLORS.categoryColors] || COLORS.gradient[0],
      percentage: ((value / events.length) * 100).toFixed(1),
    })) : [];

    const tasksByCategory = hasTasks ? Object.entries(
      tasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS.categoryColors[name as keyof typeof COLORS.categoryColors] || COLORS.gradient[1],
      percentage: ((value / tasks.length) * 100).toFixed(1),
    })) : [];

    // Enhanced priority analysis - FIXED for empty states
    const eventsByPriority = hasEvents ? Object.entries(
      events.reduce((acc, event) => {
        acc[event.priority] = (acc[event.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS.priorityColors[name as keyof typeof COLORS.priorityColors] || COLORS.gradient[0],
      percentage: ((value / events.length) * 100).toFixed(1),
    })) : [];

    // Task completion rate and productivity metrics
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // Productivity score calculation (0-100)
    const productivityScore = Math.round(
      (completionRate * 0.4) +
      (Math.min(events.length / 10, 1) * 30) +
      (Math.min(tasks.length / 15, 1) * 30)
    );

    // Current streak calculation - FIXED for empty states
    const currentDate = new Date();
    let currentStreak = 0;
    if (hasEvents || hasTasks) {
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - i);

        const hasActivity = events.some(event =>
          event.date.toDateString() === checkDate.toDateString()
        ) || tasks.some(task =>
          task.dueDate && task.dueDate.toDateString() === checkDate.toDateString() && task.completed
        );

        if (hasActivity) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Time distribution analysis - FIXED for empty states
    const timeDistribution = hasEvents ? events.reduce((acc, event) => {
      const hour = parseInt(event.startTime.split(':')[0]);
      const period = hour < 6 ? 'Early Morning' :
        hour < 12 ? 'Morning' :
          hour < 17 ? 'Afternoon' :
            hour < 21 ? 'Evening' : 'Night';
      acc[period] = (acc[period] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) : {};

    const timeDistributionData = Object.entries(timeDistribution).map(([name, value]) => ({
      name,
      value,
      percentage: hasEvents ? ((value / events.length) * 100).toFixed(1) : '0.0',
    }));

    // Weekly activity (last 7 days)
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const weeklyActivity = weekDays.map(day => {
      const dayEvents = events.filter(event =>
        event.date.toDateString() === day.toDateString()
      ).length;

      const dayTasks = tasks.filter(task =>
        task.dueDate && task.dueDate.toDateString() === day.toDateString()
      ).length;

      return {
        day: format(day, 'EEE'),
        events: dayEvents,
        tasks: dayTasks,
        total: dayEvents + dayTasks,
      };
    });

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthEvents = events.filter(event =>
        isWithinInterval(event.date, { start: monthStart, end: monthEnd })
      ).length;

      const monthTasks = tasks.filter(task =>
        task.dueDate && isWithinInterval(task.dueDate, { start: monthStart, end: monthEnd })
      ).length;

      monthlyTrends.push({
        month: format(date, 'MMM'),
        events: monthEvents,
        tasks: monthTasks,
      });
    }

    return {
      eventsByCategory,
      tasksByCategory,
      eventsByPriority,
      completionRate,
      completedTasks,
      totalTasks: tasks.length,
      productivityScore,
      currentStreak,
      timeDistributionData,
      weeklyActivity,
      monthlyTrends,
    };
  }, [events, tasks]);

  // Compact StatCard - optimized for all screen sizes
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, subtitle, icon, color, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} p-2.5 sm:p-3 lg:p-4 rounded-xl text-white shadow-md cursor-pointer relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-white/5" />
      <div className="relative z-10 flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base sm:text-lg lg:text-xl font-bold leading-tight truncate">{value}</div>
          <div className="text-[10px] sm:text-xs opacity-90 truncate">{title}</div>
        </div>
      </div>
    </motion.div>
  );

  const ViewToggle: React.FC = () => (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
      {(['overview', 'detailed'] as const).map((view) => (
        <button
          key={view}
          onClick={() => setSelectedView(view)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 ${selectedView === view
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          {view.charAt(0).toUpperCase() + view.slice(1)}
        </button>
      ))}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Debug logging to verify data
  console.log('AnalyticsDashboard - Events:', events.length, events);
  console.log('AnalyticsDashboard - Tasks:', tasks.length, tasks);

  // Check if we have any data to display
  const hasAnyData = events.length > 0 || tasks.length > 0;
  console.log('AnalyticsDashboard - hasAnyData:', hasAnyData);

  // Empty State Component
  const EmptyState: React.FC = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-6 sm:py-12 px-4 sm:px-8 text-center max-w-lg mx-auto"
    >
      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
        <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 text-violet-400" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Data Available</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
        Start adding events and tasks to see your productivity analytics. Your dashboard will update in real-time as you add content.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddEvent}
          className="bg-violet-50 hover:bg-violet-100 px-4 py-3 sm:py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
        >
          <span className="text-violet-600 font-medium text-sm sm:text-base">📅 Add Events</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddTask}
          className="bg-blue-50 hover:bg-blue-100 px-4 py-3 sm:py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
        >
          <span className="text-blue-600 font-medium text-sm sm:text-base">✅ Add Tasks</span>
        </motion.button>
      </div>
    </motion.div>
  );

  // If no data, show empty state
  if (!hasAnyData) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">

      {/* View Toggle */}
      <ViewToggle />

      {/* Compact Stats Grid - 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          title="Productivity Score"
          value={`${analytics.productivityScore}%`}
          subtitle="Based on completion & activity"
          icon={<Target className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="from-violet-500 to-purple-600"
          onClick={() => setActiveChart('productivity')}
        />
        <StatCard
          title="Current Streak"
          value={`${analytics.currentStreak} days`}
          subtitle="Consecutive active days"
          icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="from-emerald-500 to-teal-600"
          onClick={() => setActiveChart('streak')}
        />
        <StatCard
          title="Task Completion"
          value={`${analytics.completedTasks}/${analytics.totalTasks}`}
          subtitle={`${analytics.completionRate.toFixed(1)}% completion rate`}
          icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="from-blue-500 to-cyan-600"
          onClick={() => setActiveChart('completion')}
        />
        <StatCard
          title="Weekly Total"
          value={analytics.weeklyActivity.reduce((sum, day) => sum + day.total, 0)}
          subtitle="Events & Tasks this week"
          icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
          color="from-amber-500 to-orange-600"
          onClick={() => setActiveChart('weekly')}
        />
      </div>

      {/* Advanced Charts Grid */}
      <AnimatePresence mode="wait">
        {selectedView === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
          >
            {/* Enhanced Weekly Activity */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 col-span-1 lg:col-span-2"
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                Weekly Activity Overview
              </h3>
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 225 : 250}>
                <ComposedChart data={analytics.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    domain={[0, 'dataMax + 1']}
                    allowDecimals={false}
                    tickCount={6}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="events" fill="#8B5CF6" name="Events" radius={[4, 4, 0, 0]} maxBarSize={15} />
                  <Line type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={3} name="Total" />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Productivity Score Radial Chart */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100"
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                Productivity Score
              </h3>
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 225 : 250}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{
                  name: 'Productivity',
                  value: analytics.productivityScore,
                  fill: '#8B5CF6'
                }]}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8B5CF6" />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-800">
                    {analytics.productivityScore}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Enhanced Category Distribution */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100"
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                Category Distribution
              </h3>
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 225 : 250}>
                <PieChart>
                  <Pie
                    data={analytics.eventsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={window.innerWidth < 640 ? 60 : window.innerWidth < 1024 ? 75 : 85}
                    innerRadius={window.innerWidth < 640 ? 30 : window.innerWidth < 1024 ? 40 : 45}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {analytics.eventsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${props.payload.percentage}%)`,
                      name
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                    formatter={(value: string, entry: any) => {
                      const item = analytics.eventsByCategory.find(c => c.name === value);
                      return item ? `${value} (${item.percentage}%)` : value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
          >
            {/* Time Distribution */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100"
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                Time Distribution
              </h3>
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 225 : 250}>
                <BarChart data={analytics.timeDistributionData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#06B6D4" radius={[0, 4, 4, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Priority Analysis */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100"
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                Priority Analysis
              </h3>
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 225 : 250}>
                <PieChart>
                  <Pie
                    data={analytics.eventsByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    innerRadius={window.innerWidth < 640 ? 30 : window.innerWidth < 1024 ? 40 : 45}
                    outerRadius={window.innerWidth < 640 ? 60 : window.innerWidth < 1024 ? 75 : 85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analytics.eventsByPriority.map((entry, index) => (
                      <Cell key={`priority-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${props.payload.percentage}%)`,
                      name
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                    formatter={(value: string, entry: any) => {
                      const item = analytics.eventsByPriority.find(c => c.name === value);
                      return item ? `${value} (${item.percentage}%)` : value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Monthly Trends */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 col-span-1 lg:col-span-2"
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                6-Month Productivity Trends
              </h3>
              <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 225 : 250}>
                <AreaChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stackId="1"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                    name="Events"
                  />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stackId="1"
                    stroke="#06B6D4"
                    fill="#06B6D4"
                    fillOpacity={0.6}
                    name="Tasks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div >
  );
};

export default AnalyticsDashboard;

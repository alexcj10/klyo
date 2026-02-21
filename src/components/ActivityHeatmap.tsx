import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, eachDayOfInterval, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Event, Task } from '../types';

interface ActivityHeatmapProps {
    events: Event[];
    tasks: Task[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ events, tasks }) => {
    const today = new Date();

    // Automatic start year detection
    const startYear = useMemo(() => {
        const eventDates = events.map(e => e.date.getFullYear());
        const taskDates = tasks
            .filter(t => t.completed && t.dueDate)
            .map(t => t.dueDate!.getFullYear());

        const allYears = [...eventDates, ...taskDates, today.getFullYear()];
        return Math.min(...allYears);
    }, [events, tasks, today]);

    const availableYears = useMemo(() => {
        const currentYear = today.getFullYear();
        const years = [];
        for (let y = currentYear; y >= startYear; y--) {
            years.push(y);
        }
        return years;
    }, [startYear, today]);

    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    // Get calendar year days for selected year
    const yearlyDays = useMemo(() => {
        const yearDate = new Date(selectedYear, 0, 1);
        return eachDayOfInterval({
            start: startOfYear(yearDate),
            end: endOfYear(yearDate)
        });
    }, [selectedYear]);

    // Activity map: date string -> count
    const activityMap = useMemo(() => {
        const map: Record<string, number> = {};

        events.forEach(event => {
            const d = event.date.toDateString();
            map[d] = (map[d] || 0) + 1;
        });

        tasks.filter(t => t.completed && t.dueDate).forEach(task => {
            const d = task.dueDate!.toDateString();
            map[d] = (map[d] || 0) + 1;
        });

        return map;
    }, [events, tasks]);

    const getDayInfo = (date: Date) => ({
        date: format(date, 'MMM d, yyyy'),
        count: activityMap[date.toDateString()] || 0
    });

    const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: string, count: number }>(() => getDayInfo(today));

    const totalYearlyActivities = useMemo(() => {
        return yearlyDays.reduce((acc, day) => acc + (activityMap[day.toDateString()] || 0), 0);
    }, [yearlyDays, activityMap]);

    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-gray-100';
        if (count <= 2) return 'bg-blue-200 text-blue-800';
        if (count <= 4) return 'bg-blue-400 text-white';
        if (count <= 6) return 'bg-blue-600 text-white';
        return 'bg-blue-800 text-white';
    };

    return (
        <div className="space-y-8">
            {/* Yearly View */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-800">Yearly Activity</h3>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="bg-gray-50 border-none text-blue-600 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                                {totalYearlyActivities} Total
                            </span>
                        </div>
                        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                        <p className="text-xs text-gray-500">Productivity in {selectedYear}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.div
                            key={selectedDayInfo.date}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap"
                        >
                            {selectedDayInfo.date}: {selectedDayInfo.count}
                        </motion.div>

                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                            <span>Less</span>
                            <div className="w-2.5 h-2.5 rounded-sm bg-gray-100" />
                            <div className="w-2.5 h-2.5 rounded-sm bg-blue-200" />
                            <div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
                            <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                            <div className="w-2.5 h-2.5 rounded-sm bg-blue-800" />
                            <span>More</span>
                        </div>
                    </div>
                </div>

                <div
                    className="overflow-x-auto pb-2 scrollbar-hide"
                    onMouseLeave={() => setSelectedDayInfo(getDayInfo(today))}
                >
                    <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
                        {yearlyDays.map((day, i) => {
                            const count = activityMap[day.toDateString()] || 0;
                            const info = getDayInfo(day);
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.001 }}
                                    title={`${info.date}: ${count} activities`}
                                    onClick={() => setSelectedDayInfo(info)}
                                    onMouseEnter={() => setSelectedDayInfo(info)}
                                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm ${getColorClass(count)} hover:ring-2 hover:ring-blue-400/50 transition-all cursor-pointer`}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[2, 1, 0].map(offset => {
                    const monthDate = subMonths(today, offset);
                    const monthStart = startOfMonth(monthDate);
                    const monthEnd = endOfMonth(monthDate);
                    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                    const totalInMonth = days.reduce((acc, day) => acc + (activityMap[day.toDateString()] || 0), 0);

                    return (
                        <div
                            key={offset}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-800">{format(monthDate, 'MMMM')}</h4>
                                <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                                    {totalInMonth} Total
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                                {/* Empty slots for start of month */}
                                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} className="w-full aspect-square bg-transparent" />
                                ))}
                                {days.map((day, i) => {
                                    const count = activityMap[day.toDateString()] || 0;
                                    return (
                                        <div
                                            key={i}
                                            title={`${format(day, 'MMM d, yyyy')}: ${count}`}
                                            className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-all ${getColorClass(count)}`}
                                        >
                                            {day.getDate()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityHeatmap;

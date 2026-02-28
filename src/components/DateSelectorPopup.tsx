import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    format,
    startOfYear,
    eachMonthOfInterval,
    endOfYear,
    getYear,
    setYear,
    setMonth
} from 'date-fns';

interface DateSelectorPopupProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onSelectDate: (date: Date) => void;
    viewMode: 'day' | 'month' | 'week' | 'year';
}

const DateSelectorPopup: React.FC<DateSelectorPopupProps> = ({
    isOpen,
    onClose,
    currentDate,
    onSelectDate,
    viewMode
}) => {
    const [selectorYear, setSelectorYear] = useState(getYear(currentDate));

    // Reset selector year when popup opens to match current date
    React.useEffect(() => {
        if (isOpen) {
            setSelectorYear(getYear(currentDate));
        }
    }, [isOpen, currentDate]);

    const months = eachMonthOfInterval({
        start: startOfYear(new Date(selectorYear, 0, 1)),
        end: endOfYear(new Date(selectorYear, 0, 1))
    });

    const years = Array.from({ length: 12 }, (_, i) => selectorYear - 5 + i);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        className="relative bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden w-full max-w-[320px]"
                    >
                        {/* Header */}
                        <div className="px-5 py-2.5 border-b border-blue-50 flex items-center justify-between bg-blue-50/50">
                            <h3 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                {viewMode === 'year' ? 'Select Year' : 'Select Month'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-5">
                            {/* Year Selector Control - Only show if not in year mode or to change year for month selection */}
                            <div className="flex items-center justify-between mb-5 bg-gray-50/80 p-1.5 rounded-2xl">
                                <button
                                    onClick={() => setSelectorYear(prev => prev - 1)}
                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="text-base font-bold text-gray-900">{selectorYear}</span>
                                <button
                                    onClick={() => setSelectorYear(prev => prev + 1)}
                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>

                            {viewMode === 'year' ? (
                                /* Year Grid */
                                <div className="grid grid-cols-3 gap-3">
                                    {years.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => {
                                                onSelectDate(setYear(currentDate, year));
                                                onClose();
                                            }}
                                            className={`
                        py-3 rounded-2xl text-sm font-semibold transition-all
                        ${year === getYear(currentDate)
                                                    ? 'bg-blue-500 text-white shadow-sm'
                                                    : 'bg-white border border-gray-100 text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                                                }
                      `}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                /* Month Grid */
                                <div className="grid grid-cols-3 gap-3">
                                    {months.map((month, idx) => {
                                        const isSelected = getYear(currentDate) === selectorYear && currentDate.getMonth() === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    const newDate = setMonth(setYear(currentDate, selectorYear), idx);
                                                    onSelectDate(newDate);
                                                    onClose();
                                                }}
                                                className={`
                          py-3 rounded-2xl text-sm font-semibold transition-all
                          ${isSelected
                                                        ? 'bg-blue-500 text-white shadow-sm'
                                                        : 'bg-white border border-gray-100 text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                                                    }
                        `}
                                            >
                                                {format(month, 'MMM')}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer / Today shortcut */}
                        <div className="px-5 py-3 bg-gray-50/30 border-t border-blue-50">
                            <button
                                onClick={() => {
                                    onSelectDate(new Date());
                                    onClose();
                                }}
                                className="w-full py-2.5 bg-white border border-blue-100 text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-all text-xs"
                            >
                                Go to Today
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DateSelectorPopup;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Clock, Sun, Moon, Search, Sparkles } from 'lucide-react';
import { cities } from '../data/cities';


interface WorldClockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WorldClockModal: React.FC<WorldClockModalProps> = ({ isOpen, onClose }) => {
    const [time, setTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const filteredCities = cities.filter(city =>
        city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCityTime = (timezone: string) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: timezone,
        }).format(time);
    };

    const getDayNightStatus = (timezone: string) => {
        const cityTime = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
        const hours = cityTime.getHours();
        return hours >= 6 && hours < 18 ? 'day' : 'night';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-[94%] sm:w-full max-w-[340px] sm:max-w-lg max-h-[70vh] sm:max-h-[90vh] bg-gray-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-gray-100/50 flex items-center justify-between bg-white">
                            <div className="flex items-center space-x-3">
                                <div className="relative group">
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                                        <Globe className="w-5 h-5 text-white/90" />
                                        <motion.div
                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-blue-400 mix-blend-overlay"
                                        />
                                    </div>
                                    <div className="absolute -top-1 -right-1">
                                        <div className="bg-white rounded-full p-0.5 shadow-sm">
                                            <Sparkles className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-base font-extrabold text-gray-900 tracking-tight leading-tight">World Clock</h2>
                                    <div className="flex items-center space-x-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Live Sync</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-5 py-3 bg-white border-b border-gray-50">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search 100+ cities..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-500/10 rounded-xl text-sm font-medium placeholder:text-gray-400 transition-all"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50">
                            <div className="space-y-3">
                                {filteredCities.length > 0 ? (
                                    filteredCities.map((city) => {
                                        const status = getDayNightStatus(city.timezone);
                                        return (
                                            <motion.div
                                                key={city.city}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="group flex items-center justify-between p-3.5 rounded-xl bg-white hover:shadow-lg hover:shadow-gray-200/50 border border-transparent hover:border-blue-100 transition-all duration-300"
                                            >
                                                <div className="flex items-center space-x-3.5">
                                                    <div className="text-xl filter drop-shadow-sm">{city.flag}</div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{city.city}</h3>
                                                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{city.country}</p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-base font-bold font-mono text-gray-900 tracking-tighter tabular-nums leading-none">
                                                        {formatCityTime(city.timezone)}
                                                    </div>
                                                    <div className="flex items-center justify-end space-x-1 mt-1">
                                                        {status === 'day' ? (
                                                            <Sun className="w-3 h-3 text-amber-500 fill-amber-100" />
                                                        ) : (
                                                            <Moon className="w-3 h-3 text-indigo-400 fill-indigo-100" />
                                                        )}
                                                        <span className="text-[9px] uppercase font-bold text-gray-400 leading-none">
                                                            {status === 'day' ? 'Day' : 'Night'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <Search className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">No cities found</p>
                                        <p className="text-xs text-gray-500 mt-1">Try searching for a different city or country</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer shadow info */}
                        <div className="px-5 py-3 bg-white border-t border-gray-100 text-center">
                            <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                <span>Global Atomic Time</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WorldClockModal;

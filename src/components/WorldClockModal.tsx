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

    // Helper to convert emoji flag to ISO country code for FlagCDN
    const flagToCountryCode = (flagEmoji: string) => {
        if (!flagEmoji || flagEmoji.length < 2) return null;
        try {
            const chars = Array.from(flagEmoji);
            const code = chars.map(char => {
                const cp = char.codePointAt(0);
                if (cp && cp >= 0x1F1E6 && cp <= 0x1F1FF) {
                    return String.fromCharCode(cp - 0x1F1E6 + 65).toLowerCase();
                }
                return '';
            }).join('');
            return code.length === 2 ? code : null;
        } catch (e) {
            return null;
        }
    };

    // Robust deduplication and filtering
    const displayCities = React.useMemo(() => {
        if (!cities || !Array.isArray(cities)) return [];

        // 1. Deduplicate
        const uniqueMap = new Map<string, typeof cities[0]>();
        cities.forEach(item => {
            if (item && item.city && !uniqueMap.has(item.city)) {
                uniqueMap.set(item.city, item);
            }
        });
        const unique = Array.from(uniqueMap.values());

        // 2. Filter
        const query = searchQuery.toLowerCase();
        const filtered = unique.filter(city =>
        (city?.city?.toLowerCase().includes(query) ||
            city?.country?.toLowerCase().includes(query))
        );

        // 3. Limit for performance (people search for what they need)
        return filtered.slice(0, 100);
    }, [searchQuery]);

    const formatCityTime = (timezone: string) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: timezone,
            }).format(time);
        } catch (e) {
            return '--:--:--';
        }
    };

    const getDayNightStatus = (timezone: string) => {
        try {
            const cityTime = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
            const hours = cityTime.getHours();
            return hours >= 6 && hours < 18 ? 'day' : 'night';
        } catch (e) {
            return 'day';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-[94%] sm:w-full max-w-[340px] sm:max-w-lg max-h-[70vh] sm:max-h-[90vh] md:max-h-[75vh] lg:max-h-[85vh] xl:max-h-[90vh] bg-gray-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-gray-100/50 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 rounded-lg relative">
                                    <Globe className="w-5 h-5 text-blue-600 relative z-10" />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-blue-400/20 rounded-lg"
                                    />
                                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 leading-none">World Clock</h3>
                                    <p className="text-[10px] text-blue-500 font-medium tracking-wide uppercase mt-0.5">Live Sync</p>
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
                        <div className="p-4 bg-white/50 border-b border-gray-100/50">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search 1,000+ cities..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:border-gray-300"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 hover:text-blue-500 uppercase tracking-tighter"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* City List */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide space-y-2">
                            {displayCities.map((city, index) => {
                                const status = getDayNightStatus(city.timezone);
                                const countryCode = flagToCountryCode(city.flag);
                                return (
                                    <motion.div
                                        key={`${city.city}-${index}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: Math.min(index * 0.02, 0.5) }}
                                        className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shadow-sm border border-gray-100 overflow-hidden relative group-hover:scale-110 transition-transform">
                                                {countryCode ? (
                                                    <img
                                                        src={`https://flagcdn.com/w80/${countryCode}.png`}
                                                        alt={city.country}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{city.flag}</span>
                                                )}
                                                {status === 'night' && (
                                                    <div className="absolute inset-0 bg-indigo-900/10" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-800 text-sm truncate">{city.city}</h4>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-tight">{city.country}</span>
                                                    <div className={`w-1 h-1 rounded-full ${status === 'day' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                                                    {status === 'day' ? <Sun className="w-2.5 h-2.5 text-amber-500" /> : <Moon className="w-2.5 h-2.5 text-indigo-500" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-blue-600 mb-0.5">
                                                <Clock className="w-3 h-3 opacity-50" />
                                                <span className="font-mono font-bold text-sm tracking-tighter">
                                                    {formatCityTime(city.timezone)}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${status === 'day' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {status === 'day' ? 'Morning' : 'Evening'}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {displayCities.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <Search className="w-10 h-10 mb-2 opacity-10" />
                                    <p className="text-sm font-medium">No cities found matching your search</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-white border-t border-gray-100/50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Time Engine v2.0</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-green-600 uppercase">System Active</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WorldClockModal;

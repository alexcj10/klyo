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

    // Reset search when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

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

        // 1. Deduplicate by city + country
        const uniqueMap = new Map<string, typeof cities[0]>();
        cities.forEach(item => {
            if (item && item.city && item.country) {
                const key = `${item.city}-${item.country}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, item);
                }
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

    const getTimeInfo = (timezone: string) => {
        try {
            const cityTime = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
            const hours = cityTime.getHours();

            let period = 'Night';
            let status: 'day' | 'night' = 'night';

            if (hours >= 5 && hours < 12) {
                period = 'Morning';
                status = 'day';
            } else if (hours >= 12 && hours < 17) {
                period = 'Afternoon';
                status = 'day';
            } else if (hours >= 17 && hours < 21) {
                period = 'Evening';
                status = 'night';
            } else {
                period = 'Night';
                status = 'night';
            }

            // Calculate offset relative to local time
            const now = new Date();
            const targetStr = now.toLocaleString('en-US', { timeZone: timezone });
            const target = new Date(targetStr);
            const local = new Date(now.toLocaleString('en-US'));

            const diffMs = target.getTime() - local.getTime();
            const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 2) / 2;

            let offsetLabel = 'Local';
            if (diffHours !== 0) {
                offsetLabel = `${diffHours > 0 ? '+' : ''}${diffHours}h`;
            }

            return { period, status, offsetLabel };
        } catch (e) {
            return { period: 'Day', status: 'day' as const, offsetLabel: '' };
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-[94%] sm:w-full max-w-[340px] sm:max-w-lg max-h-[65vh] sm:max-h-[90vh] md:max-h-[75vh] lg:max-h-[85vh] xl:max-h-[80vh] bg-gray-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
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
                                const { period, status, offsetLabel } = getTimeInfo(city.timezone);
                                const countryCode = flagToCountryCode(city.flag);
                                return (
                                    <motion.div
                                        key={`${city.city}-${index}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: Math.min(index * 0.02, 0.5) }}
                                        className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shadow-sm border border-gray-100 overflow-hidden relative group-hover:scale-110 transition-transform text-2xl shrink-0">
                                                {countryCode ? (
                                                    <img
                                                        src={`https://flagcdn.com/${countryCode}.svg`}
                                                        alt={city.country}
                                                        className="w-full h-full object-cover"
                                                        style={{ imageRendering: 'auto' }} // Ensures smooth HD rendering for SVGs
                                                    />
                                                ) : (
                                                    <span>{city.flag}</span>
                                                )}
                                                {status === 'night' && (
                                                    <div className="absolute inset-0 bg-indigo-900/10" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-bold text-gray-800 text-sm truncate">{city.city}</h4>
                                                    <span className="text-[10px] text-blue-500/80 font-bold bg-blue-50/50 px-1 rounded uppercase tracking-tighter shrink-0">{offsetLabel}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-tight truncate">{city.country}</span>
                                                    <div className={`w-1 h-1 rounded-full shrink-0 ${status === 'day' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                                                    {status === 'day' ? <Sun className="w-2.5 h-2.5 text-amber-500 shrink-0" /> : <Moon className="w-2.5 h-2.5 text-indigo-500 shrink-0" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end shrink-0 ml-auto">
                                            <div className="flex items-center gap-1 text-blue-600 mb-0.5 whitespace-nowrap">
                                                <Clock className="w-3 h-3 opacity-50 shrink-0" />
                                                <span className="font-mono font-bold text-sm tracking-tighter">
                                                    {formatCityTime(city.timezone)}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap ${status === 'day' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {period}
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

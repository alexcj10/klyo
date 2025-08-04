import React, { useState } from 'react';
import { Menu, Search, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { motion } from 'framer-motion';
import SearchOverlay from './SearchOverlay';
import AnalyticsButton from './AnalyticsButton';
import { Event } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleDesktopSidebar?: () => void;
  isSidebarOpen?: boolean;
  onSearch: (query: string) => void;
  events?: Event[]; // Add events prop for search functionality
  onAnalyticsClick?: () => void;
  isAnalyticsActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onToggleDesktopSidebar,
  isSidebarOpen = true,
  onSearch,
  events = [], // Destructure events from props
  onAnalyticsClick,
  isAnalyticsActive = false,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        // Kept solid white background (bg-white)
        // Added backdrop-blur-md for a "frosted glass" effect on content scrolled beneath
        // Added a slightly stronger shadow (shadow-md) for better definition
        className="bg-white backdrop-blur-md border-b border-gray-200/40 dark:border-gray-700/50 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-50 shadow-md min-h-14 sm:h-16 flex items-center relative"
      >
        {/* Left side spacer - hidden on mobile for centering */}
        <div className="hidden sm:flex items-center space-x-1 sm:space-x-4 flex-1">
          {/* Left side content if needed */}
        </div>

        {/* Centered title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent select-none animate-fade-in whitespace-nowrap">
            Klyo
          </h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-1 sm:space-x-4 ml-auto">
          <motion.div whileHover={{ scale: 1.02 }} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events..."
              readOnly
              onFocus={() => setSearchOpen(true)}
              className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 md:w-48 lg:w-64"
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchOpen(true)}
            className="md:hidden text-gray-600 hover:text-gray-800 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
          >
            <Search className="w-5 h-5" />
          </motion.button>

          {onAnalyticsClick && (
            <AnalyticsButton
              onClick={onAnalyticsClick}
              isActive={isAnalyticsActive}
            />
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleDesktopSidebar}
            title={isSidebarOpen ? 'Hide Tasks' : 'Show Tasks'}
            className="hidden lg:flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
          >
            {isSidebarOpen ? (
              <PanelRightClose className="w-5 h-5" />
            ) : (
              <PanelRightOpen className="w-5 h-5" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSidebar}
            className="lg:hidden text-gray-600 hover:text-gray-800 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.header>

      <SearchOverlay 
        open={searchOpen} 
        onClose={() => {
          setSearchOpen(false);
          onSearch(''); // Clear search query in App.tsx when closing
        }}
        onSearch={onSearch}
        events={events} // Pass events data for search functionality
      />
    </>
  );
};

export default Header;
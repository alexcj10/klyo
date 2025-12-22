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
  events?: Event[];
  onAnalyticsClick?: () => void;
  isAnalyticsActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onToggleDesktopSidebar,
  isSidebarOpen = true,
  onSearch,
  events = [],
  onAnalyticsClick,
  isAnalyticsActive = false,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-sm"
      >
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              <span className="text-gray-900">Kl</span>
              <span className="text-blue-500">y</span>
              <span className="text-gray-900">o</span>
            </h1>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Search Bar - Desktop */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative hidden lg:block"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                readOnly
                onFocus={() => setSearchOpen(true)}
                className="pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-48 xl:w-64 text-sm"
              />
            </motion.div>

            {/* Search Icon - Tablet/Mobile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchOpen(true)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {/* Analytics Button */}
            {onAnalyticsClick && (
              <AnalyticsButton
                onClick={onAnalyticsClick}
                isActive={isAnalyticsActive}
              />
            )}

            {/* Desktop Sidebar Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleDesktopSidebar}
              title={isSidebarOpen ? 'Hide Tasks' : 'Show Tasks'}
              className="hidden lg:flex p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            >
              {isSidebarOpen ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRightOpen className="w-5 h-5" />
              )}
            </motion.button>

            {/* Mobile Menu */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSidebar}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <SearchOverlay
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          onSearch('');
        }}
        onSearch={onSearch}
        events={events}
      />
    </>
  );
};

export default Header;
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface AnalyticsButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

const AnalyticsButton: React.FC<AnalyticsButtonProps> = ({ onClick, isActive = false }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
        ${isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
          : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
        }
      `}
    >
      <BarChart3 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-500'}`} />
      <span className="hidden sm:inline">Analytics</span>
    </motion.button>
  );
};

export default AnalyticsButton;

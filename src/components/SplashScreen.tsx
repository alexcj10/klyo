import React, { useEffect } from 'react';
import './SplashScreen.css';

type SplashScreenProps = {
  onDone: () => void;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 4500); // 4.5 seconds total: logo (2s) + text (2s) + buffer (0.5s)
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-[#16171A] z-[9999] overflow-hidden splash-container">
      {/* Logo - appears first, stays 2s, then disappears */}
      <div className="absolute inset-0 splash-center">
        <img 
          src="/klyo2.png" 
          alt="Klyo Logo" 
          className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain opacity-0 logo-animation"
        />
      </div>
      
      {/* Text - appears after logo disappears, stays 2s, then disappears */}
      <div className="absolute inset-0 splash-center">
        <div className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl text-center font-medium tracking-wide max-w-sm sm:max-w-md md:max-w-lg px-6 opacity-0 text-animation">
          Organize Your Day, Effortlessly
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

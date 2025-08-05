import React, { useEffect } from 'react';
import './SplashScreen.css';

type SplashScreenProps = {
  onDone: () => void;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-[#16171A] z-[9999] flex items-center justify-center overflow-hidden">
      {/* Logo - appears first, perfectly centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src="/klyo2.png" 
          alt="Klyo Logo" 
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 lg:w-24 lg:h-24 xl:w-26 xl:h-26 object-contain opacity-0 logo-animation"
        />
      </div>
      
      {/* Text - appears after logo, perfectly centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-center font-medium tracking-wide max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 sm:px-6 opacity-0 text-animation">
          Organize Your Day, Effortlessly
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

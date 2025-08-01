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
      {/* Logo - appears first, centered */}
      <div className="absolute flex items-center justify-center">
        <img 
          src="/klyo2.png" 
          alt="Klyo Logo" 
          className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain opacity-0 logo-animation"
        />
      </div>
      
      {/* Text - appears after logo, same center position */}
      <div className="absolute flex items-center justify-center">
        <div className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl text-center font-medium tracking-wide max-w-sm sm:max-w-md md:max-w-lg px-6 opacity-0 text-animation">
          Organize Your Day, Effortlessly
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

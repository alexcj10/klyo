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
          src="/klyo.png"
          alt="Klyo Logo"
          className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 object-contain opacity-0 logo-animation rounded-2xl"
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

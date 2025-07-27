import React, { useEffect } from 'react';
import './SplashScreen.css';

type SplashScreenProps = {
  onDone: () => void;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-[#16171A] flex flex-col items-center justify-center z-[9999] min-h-screen w-full overflow-hidden">
      <div className="flex flex-col items-center justify-center">
        <img 
          src="/klyo2.png" 
          alt="Klyo Logo" 
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-36 xl:h-36 object-contain opacity-0"
          style={{
            animation: 'logoAppear 1.2s cubic-bezier(0.83, 0, 0.17, 1) forwards'
          }}
        />
        <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8 text-white/80 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-center font-light tracking-wide max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4">
          Organize Your Day, Effortlessly
        </div>
      </div>

    </div>
  );
};

export default SplashScreen;

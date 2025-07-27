import React, { useEffect } from 'react';
import './SplashScreen.css'; // for animations

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
    <div className="splash-background">
      <img src="/klyo2.png" alt="Klyo Logo" className="splash-logo" />
      <div className="splash-tagline">Organize Your Day, Effortlessly</div>
    </div>
  );
};

export default SplashScreen;

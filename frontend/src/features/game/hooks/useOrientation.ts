import { useState, useEffect } from 'react';

export const useOrientation = () => {
  const [isPortraitOnMobile, setIsPortraitOnMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMob = window.innerWidth <= 768;
      const isPort = window.innerHeight > window.innerWidth;
      setIsPortraitOnMobile(isMob && isPort);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return { isPortraitOnMobile };
};

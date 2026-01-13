import React, { createContext, useContext, useEffect, useState } from 'react';

type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface AdaptiveThemeContextType {
  timeOfDay: TimeOfDay;
  primaryColor: string;
  accentColor: string;
}

const AdaptiveThemeContext = createContext<AdaptiveThemeContextType>({
  timeOfDay: 'night',
  primaryColor: '#00FFFF',
  accentColor: '#0080FF',
});

export function AdaptiveThemeProvider({ children }: { children: React.ReactNode }) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('night');
  const [primaryColor, setPrimaryColor] = useState('#00FFFF');
  const [accentColor, setAccentColor] = useState('#0080FF');

  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 9) {
        setTimeOfDay('dawn');
        setPrimaryColor('#00FFCC'); // Teal-Cyan
        setAccentColor('#FF99CC'); // Soft Rose
        document.documentElement.style.setProperty('--terra-cyan', '#00FFCC');
      } else if (hour >= 9 && hour < 17) {
        setTimeOfDay('day');
        setPrimaryColor('#0080FF'); // Deep Blue
        setAccentColor('#00FFFF'); // Cyan
        document.documentElement.style.setProperty('--terra-cyan', '#0080FF');
      } else if (hour >= 17 && hour < 20) {
        setTimeOfDay('dusk');
        setPrimaryColor('#8844FF'); // Purple
        setAccentColor('#FF4444'); // Sunset Red
        document.documentElement.style.setProperty('--terra-cyan', '#8844FF');
      } else {
        setTimeOfDay('night');
        setPrimaryColor('#00FFFF'); // Classic Terra Cyan
        setAccentColor('#0080FF'); // Terra Blue
        document.documentElement.style.setProperty('--terra-cyan', '#00FFFF');
      }
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <AdaptiveThemeContext.Provider value={{ timeOfDay, primaryColor, accentColor }}>
      {children}
    </AdaptiveThemeContext.Provider>
  );
}

export const useAdaptiveTheme = () => useContext(AdaptiveThemeContext);

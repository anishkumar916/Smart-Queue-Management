import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'auto';
export type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ActiveTheme;
  themeChoice: ThemeChoice;
  setThemeChoice: (choice: ThemeChoice) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeChoice, setThemeChoiceState] = useState<ThemeChoice>(() => {
    const saved = localStorage.getItem('sq_theme_choice') || localStorage.getItem('sq_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved;
    }
    return 'auto'; // Default to auto following OS preference
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    if (themeChoice === 'light') return 'light';
    if (themeChoice === 'dark') return 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setThemeChoice = (choice: ThemeChoice) => {
    setThemeChoiceState(choice);
    localStorage.setItem('sq_theme_choice', choice);
    localStorage.setItem('sq_theme', choice);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let resolved: ActiveTheme;
      if (themeChoice === 'auto') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolved = themeChoice;
      }
      setActiveTheme(resolved);

      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    applyTheme();

    const handleChange = () => {
      if (themeChoice === 'auto') {
        applyTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themeChoice]);

  const toggleTheme = () => {
    setThemeChoice(activeTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, themeChoice, setThemeChoice, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

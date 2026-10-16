import React, { createContext, useContext, useState, useEffect } from 'react';
import { UIThemePreset, UIThemeDefinition, UI_THEMES } from '../types/uiTheme';

interface ThemeContextType {
  currentTheme: UIThemePreset;
  theme: UIThemeDefinition;
  setTheme: (theme: UIThemePreset) => void;
  toggleDarkLight: () => void;
}

const THEME_STORAGE_KEY = 'sanctuary_ui_theme_preset';

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'dark',
  theme: UI_THEMES['dark'],
  setTheme: () => {},
  toggleDarkLight: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<UIThemePreset>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) as UIThemePreset;
        if (saved && UI_THEMES[saved]) {
          return saved;
        }
      } catch {
        // fallback
      }
    }
    return 'dark';
  });

  const setTheme = (themeId: UIThemePreset) => {
    if (UI_THEMES[themeId]) {
      setCurrentTheme(themeId);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
      } catch {
        // ignore
      }
    }
  };

  const toggleDarkLight = () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Keep html root class synced
    if (typeof document !== 'undefined') {
      const isLight = UI_THEMES[currentTheme].mode === 'light';
      if (isLight) {
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark');
      }
    }
  }, [currentTheme]);

  const activeTheme = UI_THEMES[currentTheme] || UI_THEMES['dark'];

  return (
    <ThemeContext.Provider value={{ currentTheme, theme: activeTheme, setTheme, toggleDarkLight }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useUITheme = () => useContext(ThemeContext);

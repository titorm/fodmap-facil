import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  lightColors,
  darkColors,
  spacing,
  typography,
  borderRadius,
  shadows,
  accessibility,
} from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: typeof lightColors | typeof darkColors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  accessibility: typeof accessibility;
  isDark: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'system',
}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode);

  // Determine the actual theme to use based on mode and system preference
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  const effectiveTheme = getEffectiveTheme();
  const isDark = effectiveTheme === 'dark';

  const theme: Theme = {
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    borderRadius,
    shadows,
    accessibility,
    isDark,
  };

  const toggleTheme = () => {
    setThemeMode((current) => {
      if (current === 'system') {
        // If system, toggle to opposite of current system theme
        return systemColorScheme === 'dark' ? 'light' : 'dark';
      }
      // If explicitly set, toggle between light and dark
      return current === 'light' ? 'dark' : 'light';
    });
  };

  const contextValue: ThemeContextValue = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

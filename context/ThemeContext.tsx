import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const THEME_STORAGE_KEY = '@app_theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds
  background: string;
  headerBackground: string;
  cardBackground: string;
  inputBackground: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Borders
  border: string;
  separator: string;
  
  // Accent
  primary: string;
  primaryText: string;
  
  // Status
  live: string;
  hot: string;
  
  // Other
  icon: string;
  iconMuted: string;
  filterInactive: string;
  tabBarBackground: string;
  tabBarBorder: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Backgrounds
    background: '#080C17',
    headerBackground: '#080C17',
    cardBackground: '#111828',
    inputBackground: '#111828',
    
    // Text
    text: '#ffffff',
    textSecondary: '#ACB1BD',
    textMuted: '#374B78',
    
    // Borders
    border: '#1A253D',
    separator: '#1f2937',
    
    // Accent
    primary: '#22c55e',
    primaryText: '#000000',
    
    // Status
    live: '#ffffff',
    hot: '#FFF04E',
    
    // Other
    icon: '#ffffff',
    iconMuted: '#6b7280',
    filterInactive: '#111828',
    tabBarBackground: '#111828',
    tabBarBorder: '#182443',
  },
};

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Backgrounds
    background: '#F3F4F6',
    headerBackground: '#FFFFFF',
    cardBackground: '#FFFFFF',
    inputBackground: '#FFFFFF',
    
    // Text
    text: '#18223A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    
    // Borders
    border: '#18223A',
    separator: '#E5E7EB',
    
    // Accent
    primary: '#32A95D',
    primaryText: '#FFFFFF',
    
    // Status
    live: '#18223A',
    hot: '#FFF04E',
    
    // Other
    icon: '#18223A',
    iconMuted: '#6B7280',
    filterInactive: '#FFFFFF',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
      } else {
        // Default to system preference or dark mode
        const defaultTheme = systemColorScheme === 'light' ? 'light' : 'dark';
        setThemeModeState(defaultTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeModeState(newMode);
    saveTheme(newMode);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveTheme(mode);
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  // Don't render until theme is loaded to prevent flash
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: themeMode === 'dark',
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export themes for direct access if needed
export { darkTheme, lightTheme };


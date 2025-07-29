import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { Theme, ThemeColors, getThemeColors, getStatusBarStyle } from './colors';

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  statusBarStyle: 'light-content' | 'dark-content';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme
}) => {
  // Get system theme preference
  const getSystemTheme = (): Theme => {
    const colorScheme: ColorSchemeName = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  };

  const [theme, setThemeState] = useState<Theme>(
    initialTheme || 'light'
  );

  // Listen for system theme changes (disabled - app uses light theme by default)
  useEffect(() => {
    // Commented out to maintain light theme as default
    // const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    //   if (!initialTheme) {
    //     setThemeState(colorScheme === 'dark' ? 'dark' : 'light');
    //   }
    // });

    // return () => subscription?.remove();
  }, [initialTheme]);

  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const statusBarStyle = getStatusBarStyle(theme);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    colors,
    isDark,
    toggleTheme,
    setTheme,
    statusBarStyle,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for getting themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  styleCreator: (colors: ThemeColors, isDark: boolean) => T
): T => {
  const { colors, isDark } = useTheme();
  return styleCreator(colors, isDark);
};

// Theme colors following Apple iOS Dark mode design principles

export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    grouped: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    link: string;
  };
  
  // System colors
  system: {
    blue: string;
    green: string;
    red: string;
    orange: string;
    yellow: string;
    purple: string;
    gray: string;
    gray2: string;
    gray3: string;
    gray4: string;
    gray5: string;
    gray6: string;
  };
  
  // Gradient colors
  gradient: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  
  // Border and separator colors
  separator: string;
  border: string;
  
  // Fill colors
  fill: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
  };
}

export const lightTheme: ThemeColors = {
  background: {
    primary: '#FFFFFF',      // Pure white for primary surfaces
    secondary: '#F5F5F5',    // Softer gray for secondary backgrounds
    tertiary: '#FAFAFA',     // Very light gray for tertiary
    elevated: '#FFFFFF',     // White for elevated surfaces
    grouped: '#F8F9FA',      // Slightly warm gray for grouped content
  },

  text: {
    primary: '#212121',      // Softer black for better readability
    secondary: '#424242',    // Medium gray for secondary text
    tertiary: '#757575',     // Lighter gray for tertiary text
    quaternary: '#9E9E9E',   // Light gray for quaternary text
    link: '#1976D2',         // Professional blue for links
  },

  system: {
    blue: '#1976D2',         // Professional blue
    green: '#388E3C',        // Natural green
    red: '#D32F2F',          // Balanced red
    orange: '#F57C00',       // Warm orange
    yellow: '#FBC02D',       // Warm yellow
    purple: '#7B1FA2',       // Rich purple
    gray: '#757575',         // Balanced gray
    gray2: '#9E9E9E',        // Light gray
    gray3: '#BDBDBD',        // Lighter gray
    gray4: '#E0E0E0',        // Very light gray
    gray5: '#EEEEEE',        // Almost white gray
    gray6: '#F5F5F5',        // Very light background
  },

  gradient: {
    primary: ['#1976D2', '#42A5F5', '#1976D2'],     // Professional blue gradient
    secondary: ['#42A5F5', '#1976D2', '#7986CB'],   // Blue to purple gradient
    accent: ['#F57C00', '#FF5722', '#7B1FA2'],       // Warm to cool gradient
  },

  separator: '#E0E0E0',      // Light separator lines
  border: '#E0E0E0',         // Light borders

  fill: {
    primary: '#00000008',    // 3% black overlay
    secondary: '#00000006',  // 2.5% black overlay
    tertiary: '#00000004',   // 1.5% black overlay
    quaternary: '#00000003', // 1% black overlay
  },
};

export const darkTheme: ThemeColors = {
  background: {
    primary: '#121212',      // Softer dark gray instead of pure black
    secondary: '#1F1F1F',    // Slightly lighter for cards with better contrast
    tertiary: '#2D2D2D',     // Medium gray for sections
    elevated: '#252525',     // Elevated surfaces with better contrast
    grouped: '#181818',      // Grouped backgrounds, softer than black
  },

  text: {
    primary: '#FFFFFF',      // Pure white for primary text
    secondary: '#E8E8E8',    // Brighter white for secondary text
    tertiary: '#C0C0C0',     // Brighter gray for tertiary text
    quaternary: '#909090',   // Brighter gray for quaternary text
    link: '#4FC3F7',         // Softer blue for links
  },

  system: {
    blue: '#4FC3F7',         // Softer, more pleasant blue
    green: '#66BB6A',        // Softer green, less neon
    red: '#EF5350',          // Softer red, less harsh
    orange: '#FF9800',       // Warmer orange
    yellow: '#FFC107',       // Warmer yellow
    purple: '#AB47BC',       // Softer purple
    gray: '#9E9E9E',         // Balanced gray
    gray2: '#757575',        // Medium gray
    gray3: '#616161',        // Darker gray
    gray4: '#424242',        // Dark gray
    gray5: '#303030',        // Very dark gray
    gray6: '#212121',        // Almost black but softer
  },

  gradient: {
    primary: ['#4FC3F7', '#29B6F6', '#0288D1'],     // Softer blue gradient
    secondary: ['#29B6F6', '#4FC3F7', '#7986CB'],   // Balanced blue-purple
    accent: ['#FF9800', '#FF7043', '#AB47BC'],       // Warm to cool gradient
  },

  separator: '#484848',      // Brighter separator lines for better visibility
  border: '#484848',         // Brighter borders for better visibility

  fill: {
    primary: '#FFFFFF1A',    // 10% white overlay
    secondary: '#FFFFFF14',  // 8% white overlay
    tertiary: '#FFFFFF0F',   // 6% white overlay
    quaternary: '#FFFFFF0A', // 4% white overlay
  },
};

// Theme context type
export type Theme = 'light' | 'dark';

// Helper function to get theme colors
export const getThemeColors = (theme: Theme): ThemeColors => {
  return theme === 'dark' ? darkTheme : lightTheme;
};

// Status bar style helper
export const getStatusBarStyle = (theme: Theme): 'light-content' | 'dark-content' => {
  return theme === 'dark' ? 'light-content' : 'dark-content';
};

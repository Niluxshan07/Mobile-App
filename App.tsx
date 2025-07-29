/**
 * DefectTracker Mobile App
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, BackHandler, Alert } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import Authentication from './src/screens/Authentication';
import Home from './src/screens/Home';
import Profile from './src/screens/Profile';
import ProjectDashboard from './src/screens/ProjectDashboard';
import SplashScreen from './src/screens/SplashScreen';
import Settings from './src/screens/Settings';

// Simple navigation state management
type Screen = 'splash' | 'auth' | 'home' | 'profile' | 'projectDashboard' | 'settings';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

function AppContent() {
  const { statusBarStyle } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Handle phone back button
  useEffect(() => {
    const backAction = () => {
      if (currentScreen === 'splash') {
        // Don't handle back button during splash
        return false;
      } else if (currentScreen === 'auth') {
        // On auth screen, show exit confirmation
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true; // Prevent default back behavior
      } else if (currentScreen === 'home') {
        // On home screen, show exit confirmation
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true; // Prevent default back behavior
      } else if (currentScreen === 'profile') {
        // Go back to home screen
        setCurrentScreen('home');
        return true; // Prevent default back behavior
      } else if (currentScreen === 'projectDashboard') {
        // Go back to home screen
        setCurrentScreen('home');
        return true; // Prevent default back behavior
      } else if (currentScreen === 'settings') {
        // Go back to home screen
        setCurrentScreen('home');
        return true; // Prevent default back behavior
      }

      return false; // Allow default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentScreen]);

  // Mock authentication function
  const handleLogin = async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication - accept admin/admin or any user/user combination
    if ((username === 'admin' && password === 'admin') ||
        (username.length > 0 && password === 'user')) {
      const mockUser: User = {
        id: '1',
        username: username,
        email: `${username}@defecttracker.com`,
        role: username === 'admin' ? 'Administrator' : 'User'
      };
      setUser(mockUser);
      setCurrentScreen('home');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('auth');
  };

  const navigateToProfile = () => {
    setCurrentScreen('profile');
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
  };

  const navigateToProjectDashboard = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentScreen('projectDashboard');
  };

  const navigateToSettings = () => {
    setCurrentScreen('settings');
  };

  const handleSplashComplete = () => {
    setCurrentScreen('auth');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onAnimationComplete={handleSplashComplete} />;
      case 'auth':
        return <Authentication onLogin={handleLogin} />;
      case 'home':
        return (
          <Home
            user={user}
            onNavigateToProfile={navigateToProfile}
            onNavigateToProjectDashboard={navigateToProjectDashboard}
            onNavigateToSettings={navigateToSettings}
          />
        );
      case 'profile':
        return (
          <Profile
            user={user}
            onLogout={handleLogout}
            onNavigateBack={navigateToHome}
            onNavigateToSettings={navigateToSettings}
          />
        );
      case 'projectDashboard':
        return (
          <ProjectDashboard
            route={{ params: { projectId: selectedProjectId } }}
            navigation={{ goBack: navigateToHome }}
            onNavigateToProfile={navigateToProfile}
            onNavigateToSettings={navigateToSettings}
          />
        );
      case 'settings':
        return <Settings user={user} onLogout={handleLogout} onNavigateBack={navigateToHome} onNavigateToProfile={navigateToProfile} />;
      default:
        return <Authentication onLogin={handleLogin} />;
    }
  };

  return (
    <>
      <StatusBar barStyle={statusBarStyle} />
      {renderCurrentScreen()}
    </>
  );
}

function App() {
  return (
    <ThemeProvider initialTheme="light">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

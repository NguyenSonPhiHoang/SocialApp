import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('theme', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = {
    isDarkMode,
    colors: isDarkMode ? darkColors : lightColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Light theme colors
const lightColors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  primary: '#1877F2',
  secondary: '#E8F5E9',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#888888',
  border: '#E0E0E0',
  error: '#FF3040',
  success: '#4BB543',
  warning: '#FF9500',
  placeholder: '#9CA3AF',
  shadow: '#000000',
  headerBackground: '#1877F2',
  headerText: '#FFFFFF',
  cardBackground: '#FFFFFF',
  inputBackground: '#F9FAFB',
  buttonBackground: '#2563EB',
  buttonText: '#FFFFFF',
  likeBackground: '#FFE8EA',
  commentBackground: '#E8F5E9',
  skeletonBase: '#E0E0E0',
  skeletonHighlight: '#D0D0D0',
};

// Dark theme colors
const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#4A9EFF',
  secondary: '#2D4A3A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#999999',
  border: '#333333',
  error: '#FF6B6B',
  success: '#51CF66',
  warning: '#FFD43B',
  placeholder: '#666666',
  shadow: '#000000',
  headerBackground: '#1E1E1E',
  headerText: '#FFFFFF',
  cardBackground: '#2A2A2A',
  inputBackground: '#333333',
  buttonBackground: '#4A9EFF',
  buttonText: '#FFFFFF',
  likeBackground: '#4A2A2A',
  commentBackground: '#2A4A3A',
  skeletonBase: '#333333',
  skeletonHighlight: '#444444',
};

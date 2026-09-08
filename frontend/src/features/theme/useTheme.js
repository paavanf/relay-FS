// Hook to read the theme choice and change it.
//
// Returns `preference` ('system' | 'light' | 'dark'), `resolvedTheme`
// ('light' | 'dark' - what is actually on screen), and `setPreference`.
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext.js';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}

// ThemeProvider - light/dark theme for the whole app.
//
// The theme is a single data-theme attribute on <html>; index.css swaps the
// colour variables underneath it. index.html sets the attribute before first
// paint, so this only has to keep it in sync afterwards.

import { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContext.js';

const STORAGE_KEY = 'relay-theme';

// Read whatever index.html already decided, so the two never disagree.
function readInitialTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in private modes; the theme still applies
      // for this session, it just will not be remembered.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export default ThemeProvider;

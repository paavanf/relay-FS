// ThemeProvider - light/dark/system theme for the whole app.
//
// The theme is a single data-theme attribute on <html>; index.css swaps the
// colour variables underneath it. index.html sets that attribute before first
// paint, so this only has to keep it in sync afterwards.
//
// The three-state choice matters: "system" is not the same as having picked
// light on a machine that is currently light. Someone on system follows their
// OS when it switches at sunset; someone who picked light does not.

import { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContext.js';
import {
  SYSTEM,
  readPreference,
  writePreference,
  resolveTheme,
  applyTheme,
} from './themeStorage.js';

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(readPreference()));

  // Apply and remember whenever the choice changes. Effects only run in the
  // browser, so document is always there by this point.
  useEffect(() => {
    const resolved = resolveTheme(preference);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    writePreference(preference);
  }, [preference]);

  // Follow the OS while, and only while, the user is on "system".
  useEffect(() => {
    if (preference !== SYSTEM) return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');

    function handleChange(event) {
      const resolved = event.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyTheme(resolved);
    }

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [preference]);

  const value = { preference, resolvedTheme, setPreference: setPreferenceState };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;

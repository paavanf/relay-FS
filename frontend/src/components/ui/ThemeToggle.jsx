// ThemeToggle - a quiet icon button that switches light/dark.
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../features/theme/useTheme.js';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      // The label says what pressing it does, not what the state is.
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="rounded-lg border border-line p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

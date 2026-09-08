// ThemeToggle - a three-state segmented control: system, light, dark.
//
// Three states rather than two, because "follow my machine" is a real choice
// and a two-way switch cannot express it. The current option is filled in, so
// which one is active reads without needing a tooltip.
import { Monitor, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useTheme } from '../../features/theme/useTheme.js';

const options = [
  { value: 'system', icon: Monitor, label: 'Match system theme' },
  { value: 'light', icon: Sun, label: 'Light theme' },
  { value: 'dark', icon: Moon, label: 'Dark theme' },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-line-subtle bg-surface-sunken p-0.5"
      role="radiogroup"
      aria-label="Theme"
    >
      {options.map((option) => {
        const isActive = preference === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            title={option.label}
            onClick={() => setPreference(option.value)}
            className={cn(
              'rounded-sm p-1.5 transition-colors',
              isActive
                ? 'bg-surface-raised text-content-primary elevation-sm'
                : 'text-content-tertiary hover:text-content-primary',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

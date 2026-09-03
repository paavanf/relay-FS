// Badge - a small luminous pill for statuses and labels.
import { cn } from '../../lib/utils.js';

const variantStyles = {
  default: 'bg-white/8 text-ink-soft border-white/12',
  indigo: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/25',
  green: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25',
  amber: 'bg-amber-500/15 text-amber-200 border-amber-400/25',
  red: 'bg-rose-500/15 text-rose-200 border-rose-400/25',
  slate: 'bg-white/6 text-ink-faint border-white/10',
};

const sizeStyles = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({ children, variant = 'default', size = 'sm', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium backdrop-blur-md',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

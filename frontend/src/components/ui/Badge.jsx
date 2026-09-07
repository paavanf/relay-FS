// Badge - a small status chip. 6px radius, the smallest in the system.
//
// Variants are named for what they mean, not what colour they are, so a
// status cannot drift to a hue that contradicts it.
import { cn } from '../../lib/utils.js';

const variantStyles = {
  neutral: 'bg-surface-sunken text-ink-muted border-line',
  brand: 'bg-brand-50 text-brand-700 border-brand-600/20',
  success: 'bg-success-tint text-success border-success/20',
  warning: 'bg-warning-tint text-warning border-warning/20',
  danger: 'bg-danger-tint text-danger border-danger/20',
  info: 'bg-info-tint text-info border-info/20',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ children, variant = 'neutral', size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

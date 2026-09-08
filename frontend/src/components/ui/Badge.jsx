// Badge - a small status chip. 6px radius, the smallest in the system.
//
// Variants are named for what they mean, not what colour they are, so a
// status cannot drift to a hue that contradicts it.
import { cn } from '../../lib/utils.js';

const variantStyles = {
  neutral: 'bg-surface-sunken text-content-secondary border-line-subtle',
  brand: 'bg-brand-subtle text-brand-content border-brand-border',
  success: 'bg-success-surface text-success-content border-success-border',
  warning: 'bg-warning-surface text-warning-content border-warning-border',
  danger: 'bg-danger-surface text-danger-content border-danger-border',
  info: 'bg-info-surface text-info-content border-info-border',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ children, variant = 'neutral', size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

// buttonStyles.js
// The class lists behind Button, shared with ButtonLink.
//
// A link that navigates and a button that acts have to look identical, and
// the only way to guarantee that is for both to read the styling from one
// place - the same reasoning as fieldStyles.js.
import { cn } from '../../lib/utils.js';

const variantStyles = {
  primary: 'bg-brand-solid text-content-inverse hover:bg-brand-solid-hover active:bg-brand-solid-hover',
  secondary:
    'border border-line-strong bg-surface-raised text-content-primary hover:bg-surface-hover active:bg-surface-active',
  ghost: 'text-content-secondary hover:bg-surface-hover hover:text-content-primary',
  danger: 'bg-danger-content text-content-inverse hover:brightness-95 active:brightness-90',
};

const sizeStyles = {
  sm: 'h-8 gap-1.5 px-3 text-body-sm',
  md: 'h-9 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
};

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex items-center justify-center rounded-md font-medium',
    'transition-colors duration-150 select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

// Button - the standard action control.
// Solid teal primary, quiet bordered secondary, ghost, and danger.
// No gradients, no glow: the weight of the button is the only emphasis.

import { cn } from '../../lib/utils.js';
import { Spinner } from './Spinner.jsx';

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

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  ...props
}) {
  // A loading button is also disabled - it must not submit twice.
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors duration-150 select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

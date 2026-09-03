// Button - the standard action control.
//
// Buttons are magnetic by default: they lean toward the cursor on hover and
// spring back on exit. Pass magnetic={false} for dense rows where that would
// feel busy. Variants keep the glass language, with a lit primary.

import { cn } from '../../lib/utils.js';
import { Spinner } from './Spinner.jsx';
import { useMagnetic } from '../../hooks/useMagnetic.js';

const variantStyles = {
  primary:
    'text-white border border-white/15 bg-linear-to-b from-indigo-500 to-violet-600 shadow-[0_10px_36px_-10px_rgba(124,58,237,0.85),inset_0_1px_0_0_rgba(255,255,255,0.28)] hover:from-indigo-400 hover:to-violet-500',
  secondary:
    'text-ink border border-white/12 bg-white/6 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)] hover:bg-white/11 hover:border-white/20',
  ghost: 'text-ink-soft border border-transparent hover:bg-white/7 hover:text-ink',
  danger:
    'text-white border border-rose-300/25 bg-linear-to-b from-rose-500 to-rose-600 shadow-[0_10px_36px_-12px_rgba(244,63,94,0.8),inset_0_1px_0_0_rgba(255,255,255,0.25)] hover:from-rose-400 hover:to-rose-500',
};

const sizeStyles = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  magnetic = true,
  className,
  ...props
}) {
  const { magneticRef, magneticProps } = useMagnetic(0.22);

  // A loading button is also a disabled button - don't let it be clicked twice.
  const isDisabled = disabled || isLoading;
  const pull = magnetic && !isDisabled;

  return (
    <button
      ref={pull ? magneticRef : undefined}
      {...(pull ? magneticProps : {})}
      disabled={isDisabled}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight',
        'transition-colors duration-300 select-none',
        'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void',
        'disabled:cursor-not-allowed disabled:opacity-45',
        pull && 'magnetic',
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

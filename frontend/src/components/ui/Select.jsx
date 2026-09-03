// Select - a styled native <select> with a label and error message.
// Options are passed as children, e.g. <Select><option>...</option></Select>.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Select = forwardRef(function Select(
  { label, error, children, className, ...props },
  ref,
) {
  const id = useId();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-xs font-medium tracking-wider text-ink-soft uppercase"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        ref={ref}
        className={cn(
          'w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-ink backdrop-blur-xl',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-all duration-300',
          'hover:bg-white/6 focus:outline-none',
          error ? 'border-rose-400/50' : 'border-white/10 focus:border-indigo-400/60',
          className,
        )}
        {...props}
      >
        {children}
      </select>

      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  );
});

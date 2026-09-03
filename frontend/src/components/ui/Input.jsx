// Input - a glass text field with a label and an optional error message.
// Uses forwardRef because form libraries need a ref to the real <input>.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  // useId gives us a unique id so the label points at the right input.
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

      <input
        id={id}
        ref={ref}
        className={cn(
          'w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-ink backdrop-blur-xl',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-all duration-300',
          'placeholder:text-ink-faint',
          'hover:bg-white/6 focus:bg-white/7 focus:outline-none',
          error
            ? 'border-rose-400/50 focus:border-rose-400/70'
            : 'border-white/10 focus:border-indigo-400/60',
          className,
        )}
        {...props}
      />

      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  );
});

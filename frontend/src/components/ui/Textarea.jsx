// Textarea - a multi-line glass text box. Same pattern as Input.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Textarea = forwardRef(function Textarea({ label, error, className, ...props }, ref) {
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

      <textarea
        id={id}
        ref={ref}
        rows={4}
        className={cn(
          'w-full resize-y rounded-xl border bg-white/4 px-4 py-3 text-sm text-ink backdrop-blur-xl',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-all duration-300',
          'placeholder:text-ink-faint hover:bg-white/6 focus:bg-white/7 focus:outline-none',
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

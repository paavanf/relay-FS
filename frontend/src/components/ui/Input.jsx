// Input - a text input with a label and an optional error message.
// Uses forwardRef because form libraries need a ref to the real <input>.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  // useId gives us a unique id so the label points at the right input.
  const id = useId();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <input
        id={id}
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
          'placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500',
          error ? 'border-red-400' : 'border-slate-300',
          className,
        )}
        {...props}
      />

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});

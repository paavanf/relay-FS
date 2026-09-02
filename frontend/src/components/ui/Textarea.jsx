// Textarea - a multi-line text box. Same pattern as Input.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Textarea = forwardRef(function Textarea({ label, error, className, ...props }, ref) {
  const id = useId();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <textarea
        id={id}
        ref={ref}
        rows={4}
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

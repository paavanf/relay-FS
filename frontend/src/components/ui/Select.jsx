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
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <select
        id={id}
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
          'focus-visible:ring-2 focus-visible:ring-indigo-500',
          error ? 'border-red-400' : 'border-slate-300',
          className,
        )}
        {...props}
      >
        {children}
      </select>

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});

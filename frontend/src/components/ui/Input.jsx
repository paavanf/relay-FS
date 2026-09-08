// Input - a labelled text field with an inline error below.
// Label is sentence case, sits above the field. forwardRef so form libraries
// can reach the real <input>.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Input = forwardRef(function Input({ label, error, hint, className, ...props }, ref) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-label text-content-secondary">
          {label}
        </label>
      )}

      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-9 w-full rounded-md border bg-surface-raised px-3 text-sm text-content-primary',
          'transition-colors placeholder:text-content-tertiary',
          'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-line-focus',
          error ? 'border-danger-content' : 'border-line-strong hover:border-content-tertiary',
          className,
        )}
        {...props}
      />

      {hint && !error && <p className="mt-1.5 text-xs text-content-tertiary">{hint}</p>}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-danger-content">
          {error}
        </p>
      )}
    </div>
  );
});

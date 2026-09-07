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
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
          {label}
        </label>
      )}

      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-9 w-full rounded-lg border bg-surface-raised px-3 text-sm text-ink',
          'transition-colors placeholder:text-ink-subtle',
          'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-600',
          error ? 'border-danger' : 'border-line-strong hover:border-ink-subtle',
          className,
        )}
        {...props}
      />

      {hint && !error && <p className="mt-1.5 text-xs text-ink-subtle">{hint}</p>}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

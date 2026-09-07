// Select - a styled native select. Native because it behaves correctly on
// touch devices, which is where a lot of shift workers will be.
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
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
          {label}
        </label>
      )}

      <select
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-9 w-full rounded-lg border bg-surface-raised px-3 text-sm text-ink',
          'transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-600',
          error ? 'border-danger' : 'border-line-strong hover:border-ink-subtle',
          className,
        )}
        {...props}
      >
        {children}
      </select>

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
});

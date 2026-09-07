// Textarea - multi-line field. Same shape as Input.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Textarea = forwardRef(function Textarea({ label, error, className, ...props }, ref) {
  const id = useId();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
          {label}
        </label>
      )}

      <textarea
        id={id}
        ref={ref}
        rows={4}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full resize-y rounded-lg border bg-surface-raised px-3 py-2 text-sm text-ink',
          'transition-colors placeholder:text-ink-subtle',
          'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-600',
          error ? 'border-danger' : 'border-line-strong hover:border-ink-subtle',
          className,
        )}
        {...props}
      />

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
});

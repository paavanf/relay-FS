// Textarea - multi-line field. Same shape as Input.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Textarea = forwardRef(function Textarea({ label, error, className, ...props }, ref) {
  const id = useId();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-label text-content-secondary">
          {label}
        </label>
      )}

      <textarea
        id={id}
        ref={ref}
        rows={4}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full resize-y rounded-md border bg-surface-raised px-3 py-2 text-sm text-content-primary',
          'transition-colors placeholder:text-content-tertiary',
          'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-line-focus',
          error ? 'border-danger-content' : 'border-line-strong hover:border-content-tertiary',
          className,
        )}
        {...props}
      />

      {error && <p className="mt-1.5 text-xs text-danger-content">{error}</p>}
    </div>
  );
});

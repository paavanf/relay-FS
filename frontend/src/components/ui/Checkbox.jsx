// Checkbox - a checkbox and its label.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

export const Checkbox = forwardRef(function Checkbox({ label, className, ...props }, ref) {
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        ref={ref}
        type="checkbox"
        className={cn(
          'size-4 rounded border-line-strong text-brand-600 transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          className,
        )}
        {...props}
      />

      {label && (
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
      )}
    </div>
  );
});

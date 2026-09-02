// Checkbox - a styled checkbox sitting next to its label.
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
          'size-4 rounded border-slate-300 text-indigo-600 transition-colors',
          'focus-visible:ring-2 focus-visible:ring-indigo-500',
          className,
        )}
        {...props}
      />

      {label && (
        <label htmlFor={id} className="text-sm text-slate-700">
          {label}
        </label>
      )}
    </div>
  );
});

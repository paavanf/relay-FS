// Input - a labelled text field with an inline error below.
// Label is sentence case, sits above the field. forwardRef so form libraries
// can reach the real <input>.
//
// The styling lives in fieldStyles.js because PasswordInput has to match it
// exactly.
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';
import { fieldLabel, fieldBase, fieldBorder, fieldHint, fieldError } from './fieldStyles.js';

export const Input = forwardRef(function Input({ label, error, hint, className, ...props }, ref) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={fieldLabel}>
          {label}
        </label>
      )}

      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(fieldBase, fieldBorder(Boolean(error)), className)}
        {...props}
      />

      {hint && !error && <p className={fieldHint}>{hint}</p>}
      {error && (
        <p id={errorId} className={fieldError}>
          {error}
        </p>
      )}
    </div>
  );
});

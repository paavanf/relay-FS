// PasswordInput - a password field with a show/hide toggle.
//
// A drop-in replacement for Input: same label / error / hint props, same
// styling, read from fieldStyles.js so the two can never drift apart.
//
// Two details that matter and are easy to get wrong:
//   the toggle is type="button", or it submits the form it sits in
//   toggling only changes the input's `type`, so the value and the caret
//   position survive - React keeps the same DOM node either way
import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { fieldLabel, fieldBase, fieldBorder, fieldHint, fieldError } from './fieldStyles.js';

export const PasswordInput = forwardRef(function PasswordInput(
  { label, error, hint, helperText, className, ...props },
  ref,
) {
  const [isVisible, setIsVisible] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;

  // `hint` is what Input calls it; `helperText` is accepted as an alias so
  // either name works at the call site.
  const helper = hint ?? helperText;
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={fieldLabel}>
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          // Room on the right so long values do not run under the button.
          className={cn(fieldBase, 'pr-10', fieldBorder(Boolean(error)), className)}
          {...props}
        />

        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          // Says what pressing it does, not what the current state is.
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          title={isVisible ? 'Hide password' : 'Show password'}
          className={cn(
            'absolute inset-y-0 right-0 flex items-center rounded-md px-2.5',
            'text-content-tertiary transition-colors hover:text-content-secondary',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      </div>

      {helper && !error && <p className={fieldHint}>{helper}</p>}
      {error && (
        <p id={errorId} className={fieldError}>
          {error}
        </p>
      )}
    </div>
  );
});

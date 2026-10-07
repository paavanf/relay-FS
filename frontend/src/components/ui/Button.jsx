// Button - the standard action control.
// Solid teal primary, quiet bordered secondary, ghost, and danger.
// No gradients, no glow: the weight of the button is the only emphasis.
//
// The styling lives in buttonStyles.js because ButtonLink has to match it.

import { Spinner } from './Spinner.jsx';
import { buttonClasses } from './buttonStyles.js';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  ...props
}) {
  // A loading button is also disabled - it must not submit twice.
  const isDisabled = disabled || isLoading;

  return (
    <button disabled={isDisabled} className={buttonClasses({ variant, size, className })} {...props}>
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

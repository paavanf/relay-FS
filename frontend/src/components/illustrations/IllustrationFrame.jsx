// IllustrationFrame - the shared frame for the empty-state drawings: one
// size, one stroke weight, rounded joins, decorative to a screen reader (the
// empty state's own words say what it means). Each drawing colours its parts
// with token classes, so it follows the theme like everything else.
import { cn } from '../../lib/utils.js';

export function IllustrationFrame({ children, className }) {
  return (
    <svg
      viewBox="0 0 120 88"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-20 w-auto', className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

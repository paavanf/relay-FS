// Spinner - an animated loading circle.
import { cn } from '../../lib/utils.js';

const sizeStyles = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
};

export function Spinner({ size = 'md', className }) {
  return (
    <svg
      className={cn('animate-spin text-current', sizeStyles[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      {/* Faint full ring, then a brighter arc that spins on top of it. */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  );
}

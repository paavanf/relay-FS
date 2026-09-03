// Spinner - an animated loading arc with a faint track behind it.
import { cn } from '../../lib/utils.js';

const sizeStyles = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-9',
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
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

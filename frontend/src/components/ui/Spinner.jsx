// Spinner - a loading arc over a faint track.
import { cn } from '../../lib/utils.js';

const sizeStyles = {
  sm: 'size-3.5',
  md: 'size-5',
  lg: 'size-7',
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
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

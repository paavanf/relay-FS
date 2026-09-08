// Logo - the Relay mark and wordmark.
//
// The mark is three nodes joined in a loop: the shape of a multi-party swap,
// where A covers B, B covers C, and C covers A. It is drawn rather than
// decorated - no gradient, no glow.
import { cn } from '../lib/utils.js';

const markSizes = { sm: 'size-6', md: 'size-7', lg: 'size-9' };
const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };

export function Logo({ size = 'md', showText = true, className }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" fill="none" className={markSizes[size]} aria-hidden="true">
        {/* The cycle */}
        <path
          d="M16 6.5 L25 22 L7 22 Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
          className="text-brand-solid/35"
        />
        {/* The three people in it */}
        <circle cx="16" cy="6.5" r="3.2" className="fill-brand-solid" />
        <circle cx="25" cy="22" r="3.2" className="fill-brand-solid" />
        <circle cx="7" cy="22" r="3.2" className="fill-brand-solid" />
      </svg>

      {showText && (
        <span
          className={cn(
            'font-display font-semibold tracking-[-0.01em] text-content-primary',
            textSizes[size],
          )}
        >
          Relay
        </span>
      )}
    </div>
  );
}

export default Logo;

// Logo - the Relay mark (two arrows forming a cycle) plus the wordmark.
import { cn } from '../lib/utils.js';

const markSizes = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-12',
};

const textSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
};

export function Logo({ size = 'md', showText = true, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 48 48" fill="none" className={markSizes[size]} aria-hidden="true">
        <rect width="48" height="48" rx="11" fill="#4f46e5" />
        <g stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 26a13 13 0 0 1 22-9.4" />
          <path d="M33 10v7h-7" />
          <path d="M37 22a13 13 0 0 1-22 9.4" />
          <path d="M15 38v-7h7" />
        </g>
      </svg>

      {showText && (
        <span className={cn('font-semibold tracking-tight text-slate-900', textSizes[size])}>
          Relay
        </span>
      )}
    </div>
  );
}

export default Logo;

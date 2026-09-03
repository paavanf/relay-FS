// Logo - the Relay mark (two arrows forming a cycle) plus the wordmark.
// The mark sits over its own soft bloom so it reads as a lit object.
import { cn } from '../lib/utils.js';

const markSizes = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
};

const textSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
};

export function Logo({ size = 'md', showText = true, className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <div
          className="absolute inset-0 rounded-2xl bg-violet-500/50 blur-lg"
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className={cn('relative', markSizes[size])}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="relay-mark" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor="#818cf8" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="13" fill="url(#relay-mark)" />
          <g stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 26a13 13 0 0 1 22-9.4" />
            <path d="M33 10v7h-7" />
            <path d="M37 22a13 13 0 0 1-22 9.4" />
            <path d="M15 38v-7h7" />
          </g>
        </svg>
      </div>

      {showText && (
        <span className={cn('font-semibold tracking-tight text-ink', textSizes[size])}>Relay</span>
      )}
    </div>
  );
}

export default Logo;

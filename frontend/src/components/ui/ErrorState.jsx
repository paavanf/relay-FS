// ErrorState - a rose-lit glass panel telling the user something went wrong,
// with an optional Retry button.
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.jsx';

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center overflow-hidden rounded-2xl border border-rose-400/20',
        'bg-rose-500/8 px-6 py-10 text-center backdrop-blur-xl',
        className,
      )}
    >
      {/* Rose bloom bleeding in from the top. */}
      <div
        className="pointer-events-none absolute -top-16 left-1/2 size-48 -translate-x-1/2 rounded-full bg-rose-500/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative rounded-xl border border-rose-400/25 bg-rose-500/12 p-3">
        <AlertCircle className="size-5 text-rose-200" aria-hidden="true" />
      </div>

      <h3 className="relative mt-4 text-base font-semibold text-ink">{title}</h3>

      {message && <p className="relative mt-1.5 max-w-sm text-sm text-rose-100/80">{message}</p>}

      {onRetry && (
        <Button variant="secondary" size="sm" className="relative mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

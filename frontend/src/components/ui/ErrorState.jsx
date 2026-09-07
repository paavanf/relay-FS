// ErrorState - something failed, with a way to try again.
// Danger colour is used because this is a real failure, not for emphasis.
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.jsx';

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-danger/25 bg-danger-tint px-6 py-8 text-center',
        className,
      )}
    >
      <AlertTriangle className="size-5 text-danger" aria-hidden="true" />

      <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>

      {message && <p className="mt-1 max-w-sm text-[13px] text-ink-muted">{message}</p>}

      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

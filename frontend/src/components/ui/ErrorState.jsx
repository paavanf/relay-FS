// ErrorState - something failed, with a way to try again.
// Danger colour is used because this is a real failure, not for emphasis.
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.jsx';

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-danger-border bg-danger-surface px-6 py-8 text-center',
        className,
      )}
    >
      <AlertTriangle className="size-5 text-danger-content" aria-hidden="true" />

      <h3 className="mt-3 text-sm font-semibold text-content-primary">{title}</h3>

      {message && <p className="mt-1 max-w-sm text-body-sm text-content-secondary">{message}</p>}

      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

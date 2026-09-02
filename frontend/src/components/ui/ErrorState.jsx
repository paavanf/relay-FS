// ErrorState - a red-tinted panel telling the user something went wrong,
// with an optional Retry button.
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.jsx';

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center',
        className,
      )}
    >
      <AlertCircle className="size-6 text-red-600" aria-hidden="true" />

      <h3 className="mt-3 text-base font-semibold text-red-900">{title}</h3>

      {message && <p className="mt-1 max-w-sm text-sm text-red-700">{message}</p>}

      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

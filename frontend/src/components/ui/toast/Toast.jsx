// Toast - one single notification card.
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../../lib/utils.js';

// Each toast type gets its own icon and colour.
const toastStyles = {
  success: { icon: CheckCircle, colour: 'text-green-600', border: 'border-green-200' },
  error: { icon: AlertCircle, colour: 'text-red-600', border: 'border-red-200' },
  info: { icon: Info, colour: 'text-indigo-600', border: 'border-indigo-200' },
};

export function Toast({ toast, onDismiss }) {
  const style = toastStyles[toast.type] ?? toastStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-white p-4 shadow-lg',
        style.border,
      )}
      role="alert"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', style.colour)} aria-hidden="true" />

      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 transition-colors hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

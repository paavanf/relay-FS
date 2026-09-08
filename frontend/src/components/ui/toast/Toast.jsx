// Toast - one notification. Compact, with a semantic left accent so the kind
// of message reads before the text does.
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../../lib/utils.js';

const toastStyles = {
  success: { icon: CheckCircle2, tint: 'text-success-content', accent: 'bg-success-content' },
  error: { icon: AlertCircle, tint: 'text-danger-content', accent: 'bg-danger-content' },
  info: { icon: Info, tint: 'text-info-content', accent: 'bg-info-content' },
};

export function Toast({ toast, onDismiss }) {
  const style = toastStyles[toast.type] ?? toastStyles.info;
  const Icon = style.icon;

  return (
    <div
      className="pointer-events-auto relative flex w-80 items-start gap-2.5 overflow-hidden rounded-lg border border-line-subtle bg-surface-overlay py-3 pr-3 pl-4 elevation-md"
      role="alert"
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', style.accent)} aria-hidden="true" />

      <Icon className={cn('mt-px size-4 shrink-0', style.tint)} aria-hidden="true" />

      <div className="flex-1">
        <p className="text-body-sm font-medium text-content-primary">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-body-sm text-content-secondary">{toast.message}</p>}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-sm p-0.5 text-content-tertiary transition-colors hover:text-content-primary"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// Toast - one single notification card, sliding in as a glass sliver.
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../../lib/utils.js';

// Each toast type gets its own icon, accent, and glow colour.
const toastStyles = {
  success: { icon: CheckCircle, tint: 'text-emerald-300', glow: 'bg-emerald-500/25' },
  error: { icon: AlertCircle, tint: 'text-rose-300', glow: 'bg-rose-500/25' },
  info: { icon: Info, tint: 'text-indigo-300', glow: 'bg-indigo-500/25' },
};

export function Toast({ toast, onDismiss }) {
  const style = toastStyles[toast.type] ?? toastStyles.info;
  const Icon = style.icon;

  return (
    <div
      className="glass glass-edge reveal pointer-events-auto relative flex w-84 items-start gap-3.5 overflow-hidden rounded-2xl p-4"
      role="alert"
    >
      {/* Coloured bloom leaking from the left edge. */}
      <div
        className={cn('pointer-events-none absolute -left-8 size-24 rounded-full blur-2xl', style.glow)}
        aria-hidden="true"
      />

      <Icon className={cn('relative mt-0.5 size-5 shrink-0', style.tint)} aria-hidden="true" />

      <div className="relative flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.message && <p className="mt-1 text-sm text-ink-soft">{toast.message}</p>}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="relative text-ink-faint transition-colors hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// EmptyState - shown when a list has nothing in it yet.
// `icon` is a lucide-react component, passed in as `icon={Calendar}`.
import { cn } from '../../lib/utils.js';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
    >
      {Icon && (
        <div className="relative mb-6">
          {/* Halo behind the icon tile. */}
          <div
            className="absolute inset-0 rounded-2xl bg-indigo-500/25 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative rounded-2xl border border-white/12 bg-white/6 p-4 backdrop-blur-xl">
            <Icon className="size-6 text-indigo-200" aria-hidden="true" />
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      )}

      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

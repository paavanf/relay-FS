// EmptyState - shown when a list has nothing in it yet.
// `icon` is a lucide component, passed as icon={Calendar}.
import { cn } from '../../lib/utils.js';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Icon && (
        <div className="mb-4 rounded-lg border border-line bg-surface-sunken p-2.5">
          <Icon className="size-5 text-ink-subtle" aria-hidden="true" />
        </div>
      )}

      <h3 className="text-base font-semibold text-ink">{title}</h3>

      {description && <p className="mt-1.5 max-w-sm text-[13px] text-ink-muted">{description}</p>}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

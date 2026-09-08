// EmptyState - shown when a list has nothing in it yet.
// `icon` is a lucide component, passed as icon={Calendar}.
import { cn } from '../../lib/utils.js';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Icon && (
        <div className="mb-4 rounded-md border border-line-subtle bg-surface-sunken p-2.5">
          <Icon className="size-5 text-content-tertiary" aria-hidden="true" />
        </div>
      )}

      <h3 className="text-h3 text-content-primary">{title}</h3>

      {description && <p className="mt-1.5 max-w-sm text-body-sm text-content-secondary">{description}</p>}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

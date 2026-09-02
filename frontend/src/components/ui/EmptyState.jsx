// EmptyState - shown when a list has nothing in it yet.
// `icon` is a lucide-react component, passed in as `icon={Calendar}`.
import { cn } from '../../lib/utils.js';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-slate-100 p-3">
          <Icon className="size-6 text-slate-400" aria-hidden="true" />
        </div>
      )}

      <h3 className="text-base font-semibold text-slate-900">{title}</h3>

      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

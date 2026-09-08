// PageHeader - the title block at the top of a page.
// `actions` sits on the right, usually a primary button.
import { cn } from '../../lib/utils.js';

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="max-w-2xl">
        <h1 className="text-h1 tracking-[-0.01em] text-content-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-content-secondary">{description}</p>}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

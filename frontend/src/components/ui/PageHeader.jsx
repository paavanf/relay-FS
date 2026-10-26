// PageHeader - the title block at the top of a page.
// `actions` sits on the right, usually a primary button.
//
// From sm up the row never wraps: the title block shrinks and wraps its own
// text (min-w-0), and the actions keep their natural width (shrink-0), so
// they stay beside the title however long it gets. On a phone the actions
// may drop below the title. OptionsPanel's header on Swaps follows the
// same rule.
import { cn } from '../../lib/utils.js';

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap', className)}>
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-h1 text-content-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-content-secondary">{description}</p>}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

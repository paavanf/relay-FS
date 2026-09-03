// PageHeader - the title block at the top of every page.
// `actions` is anything you want on the right, usually a Button.
import { cn } from '../../lib/utils.js';

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-5', className)}>
      <div className="max-w-xl">
        <h1 className="text-aurora text-3xl font-semibold tracking-tight lg:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{description}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

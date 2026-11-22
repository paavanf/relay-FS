// EmptyState - shown when a list has nothing in it yet.
// `illustration` names one of the small drawings in components/illustrations
// ('calendar', 'swap', 'scale', 'bell', 'setup'); `icon`, a lucide component,
// is the plainer fallback for places that have no drawing. The title is an
// h2, for an empty state that stands in for a page's content right under its
// h1; as="h3" inside a section with its own h2 (see Card.jsx's CardTitle).
import { ILLUSTRATIONS } from '../illustrations/index.js';
import { cn } from '../../lib/utils.js';

export function EmptyState({ illustration, icon: Icon, title, description, action, className, as: Heading = 'h2' }) {
  const Illustration = ILLUSTRATIONS[illustration];

  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Illustration && <Illustration className="mb-5" />}
      {!Illustration && Icon && (
        <div className="mb-4 rounded-md border border-line-subtle bg-surface-sunken p-2.5">
          <Icon className="size-5 text-content-tertiary" aria-hidden="true" />
        </div>
      )}

      <Heading className="text-h3 font-stretch-normal tracking-normal text-content-primary">{title}</Heading>

      {description && <p className="mt-1.5 max-w-sm text-body-sm text-content-secondary">{description}</p>}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

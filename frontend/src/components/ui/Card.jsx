// Card and its parts. A raised white panel: hairline border, 12px radius, and
// one small shadow. All the parts live here because each is only a styled
// wrapper - six files would be noise.
import { cn } from '../../lib/utils.js';

export function Card({ children, className }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line-subtle bg-surface-raised elevation-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('space-y-1 border-b border-line-subtle px-5 py-4', className)}>{children}</div>
  );
}

// An h2, since a card usually sits right under the page's h1 and heading
// levels must not skip one; as="h3" for a card inside a section with its own
// h2. It looks the same either way: index.css widens every h2, and
// font-stretch-normal and tracking-normal undo that here.
export function CardTitle({ as: Heading = 'h2', children, className }) {
  return (
    <Heading className={cn('text-h3 font-stretch-normal tracking-normal text-content-primary', className)}>{children}</Heading>
  );
}

export function CardDescription({ children, className }) {
  return <p className={cn('text-body-sm text-content-secondary', className)}>{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('flex items-center gap-3 border-t border-line-subtle px-5 py-3', className)}>
      {children}
    </div>
  );
}

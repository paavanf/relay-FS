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

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-h3 text-content-primary', className)}>{children}</h3>
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

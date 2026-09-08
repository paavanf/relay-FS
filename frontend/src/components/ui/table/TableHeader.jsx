// TableHeader - sticky, on the sunken surface so it separates from the rows
// without needing a shadow.
import { cn } from '../../../lib/utils.js';

export function TableHeader({ children, className }) {
  return (
    <thead
      className={cn('sticky top-0 z-10 border-b border-line-subtle bg-surface-sunken', className)}
    >
      {children}
    </thead>
  );
}

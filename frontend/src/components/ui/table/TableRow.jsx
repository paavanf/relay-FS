// TableRow - a single row, with a quiet hover so the eye can track across.
import { cn } from '../../../lib/utils.js';

export function TableRow({ children, className, ...props }) {
  return (
    <tr className={cn('transition-colors hover:bg-surface-hover', className)} {...props}>
      {children}
    </tr>
  );
}

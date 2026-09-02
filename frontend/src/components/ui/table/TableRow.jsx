// TableRow - a single <tr>.
import { cn } from '../../../lib/utils.js';

export function TableRow({ children, className, ...props }) {
  return (
    <tr className={cn('transition-colors hover:bg-slate-50', className)} {...props}>
      {children}
    </tr>
  );
}

// TableRow - a single <tr>.
import { cn } from '../../../lib/utils.js';

export function TableRow({ children, className, ...props }) {
  return (
    <tr className={cn('transition-colors duration-300 hover:bg-white/5', className)} {...props}>
      {children}
    </tr>
  );
}

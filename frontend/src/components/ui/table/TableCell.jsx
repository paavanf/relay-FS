// TableCell - a normal data cell (<td>).
import { cn } from '../../../lib/utils.js';

export function TableCell({ children, className }) {
  return <td className={cn('px-5 py-4 text-ink-soft', className)}>{children}</td>;
}

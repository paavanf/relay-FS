// TableCell - a normal data cell (<td>).
import { cn } from '../../../lib/utils.js';

export function TableCell({ children, className }) {
  return <td className={cn('px-4 py-3 text-slate-700', className)}>{children}</td>;
}

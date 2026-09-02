// DialogTitle - the heading inside a dialog.
import { cn } from '../../../lib/utils.js';

export function DialogTitle({ children, className }) {
  return <h2 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h2>;
}

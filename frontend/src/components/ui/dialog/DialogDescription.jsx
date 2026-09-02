// DialogDescription - the smaller explanatory text under a DialogTitle.
import { cn } from '../../../lib/utils.js';

export function DialogDescription({ children, className }) {
  return <p className={cn('mt-1 text-sm text-slate-500', className)}>{children}</p>;
}

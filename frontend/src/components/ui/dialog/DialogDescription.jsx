// DialogDescription - the explanatory line under a DialogTitle.
import { cn } from '../../../lib/utils.js';

export function DialogDescription({ children, className }) {
  return <p className={cn('mt-1 text-[13px] text-ink-muted', className)}>{children}</p>;
}

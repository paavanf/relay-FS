// DialogDescription - the smaller explanatory text under a DialogTitle.
import { cn } from '../../../lib/utils.js';

export function DialogDescription({ children, className }) {
  return <p className={cn('mt-2 text-sm leading-relaxed text-ink-soft', className)}>{children}</p>;
}

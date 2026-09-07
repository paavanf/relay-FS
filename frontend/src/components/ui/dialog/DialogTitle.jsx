// DialogTitle - the dialog heading.
import { cn } from '../../../lib/utils.js';

export function DialogTitle({ children, className }) {
  return <h2 className={cn('text-base font-semibold text-ink', className)}>{children}</h2>;
}

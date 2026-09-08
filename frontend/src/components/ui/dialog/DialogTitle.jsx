// DialogTitle - the dialog heading.
import { cn } from '../../../lib/utils.js';

export function DialogTitle({ children, className }) {
  return <h2 className={cn('text-h3 text-content-primary', className)}>{children}</h2>;
}

// DialogTitle - the heading inside a dialog.
import { cn } from '../../../lib/utils.js';

export function DialogTitle({ children, className }) {
  return (
    <h2 className={cn('text-xl font-semibold tracking-tight text-ink', className)}>{children}</h2>
  );
}

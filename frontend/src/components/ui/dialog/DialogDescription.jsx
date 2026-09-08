// DialogDescription - the explanatory line under a DialogTitle.
import { cn } from '../../../lib/utils.js';

export function DialogDescription({ children, className }) {
  return <p className={cn('mt-1 text-body-sm text-content-secondary', className)}>{children}</p>;
}

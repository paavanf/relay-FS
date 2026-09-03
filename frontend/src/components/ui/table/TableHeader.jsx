// TableHeader - the <thead> of a table.
import { cn } from '../../../lib/utils.js';

export function TableHeader({ children, className }) {
  return <thead className={cn('border-b border-white/10 bg-white/4', className)}>{children}</thead>;
}

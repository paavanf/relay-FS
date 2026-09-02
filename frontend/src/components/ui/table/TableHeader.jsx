// TableHeader - the <thead> of a table.
import { cn } from '../../../lib/utils.js';

export function TableHeader({ children, className }) {
  return <thead className={cn('border-b border-slate-200 bg-slate-50', className)}>{children}</thead>;
}

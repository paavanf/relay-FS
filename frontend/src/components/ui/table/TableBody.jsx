// TableBody - the <tbody> of a table.
import { cn } from '../../../lib/utils.js';

export function TableBody({ children, className }) {
  return <tbody className={cn('divide-y divide-slate-200', className)}>{children}</tbody>;
}

// TableBody - hairline dividers between rows rather than zebra striping.
import { cn } from '../../../lib/utils.js';

export function TableBody({ children, className }) {
  return <tbody className={cn('divide-y divide-line', className)}>{children}</tbody>;
}

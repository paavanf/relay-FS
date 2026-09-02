// TableHead - a header cell (<th>).
import { cn } from '../../../lib/utils.js';

export function TableHead({ children, className }) {
  return (
    <th className={cn('px-4 py-3 font-medium text-slate-600', className)} scope="col">
      {children}
    </th>
  );
}

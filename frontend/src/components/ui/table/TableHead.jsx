// TableHead - a header cell (<th>).
import { cn } from '../../../lib/utils.js';

export function TableHead({ children, className }) {
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-xs font-medium tracking-wider text-ink-faint uppercase',
        className,
      )}
      scope="col"
    >
      {children}
    </th>
  );
}

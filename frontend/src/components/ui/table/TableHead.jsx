// TableHead - a header cell. Sentence case, never all-caps.
import { cn } from '../../../lib/utils.js';

export function TableHead({ children, className, ...props }) {
  return (
    <th scope="col" className={cn('px-4 py-2.5 text-label text-content-secondary', className)} {...props}>
      {children}
    </th>
  );
}

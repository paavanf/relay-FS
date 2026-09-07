// TableCell - a data cell. Pass numeric so times and hour counts render in
// the mono face, which keeps columns of figures aligned.
import { cn } from '../../../lib/utils.js';

export function TableCell({ children, numeric = false, className }) {
  return (
    <td className={cn('px-4 py-2.5 text-ink', numeric && 'data text-ink-muted', className)}>
      {children}
    </td>
  );
}

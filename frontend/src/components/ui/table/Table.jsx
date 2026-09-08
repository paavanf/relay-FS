// Table - the outer table, in a bordered panel that scrolls sideways rather
// than letting a wide roster break the page.
//
// tabular-nums is set here so every figure in the table lines up down its
// column, which is what makes a dense grid scannable.
import { cn } from '../../../lib/utils.js';

export function Table({ children, className }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-line-subtle bg-surface-raised">
      <table
        className={cn('w-full border-collapse text-left text-sm tabular-nums', className)}
      >
        {children}
      </table>
    </div>
  );
}

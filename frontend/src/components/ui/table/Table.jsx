// Table - the outer <table>. Wrapped in a scrolling glass shell so wide
// tables scroll sideways instead of breaking the page layout.
import { cn } from '../../../lib/utils.js';

export function Table({ children, className }) {
  return (
    <div className="glass w-full overflow-x-auto rounded-2xl">
      <table className={cn('w-full border-collapse text-left text-sm', className)}>{children}</table>
    </div>
  );
}

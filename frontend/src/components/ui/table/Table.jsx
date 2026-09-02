// Table - the outer <table>. Wrapped in a scrolling div so wide tables
// scroll sideways instead of breaking the page layout on small screens.
import { cn } from '../../../lib/utils.js';

export function Table({ children, className }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-sm', className)}>{children}</table>
    </div>
  );
}

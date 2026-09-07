// DialogPanel - the panel holding the dialog's content. Sized to its content
// rather than filling the screen.
import { cn } from '../../../lib/utils.js';

export function DialogPanel({ children, className }) {
  return (
    <div
      className={cn(
        'relative w-full max-w-md rounded-xl border border-line bg-surface-raised',
        'shadow-overlay',
        className,
      )}
    >
      {children}
    </div>
  );
}

// DialogPanel - the white box that holds the dialog's content.
import { cn } from '../../../lib/utils.js';

export function DialogPanel({ children, className }) {
  return (
    <div
      className={cn(
        'relative w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg',
        className,
      )}
    >
      {children}
    </div>
  );
}

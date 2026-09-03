// DialogPanel - the floating glass box that holds the dialog's content.
import { cn } from '../../../lib/utils.js';

export function DialogPanel({ children, className }) {
  return (
    <div
      className={cn(
        'glass-strong glass-edge reveal relative w-full max-w-lg rounded-3xl p-8',
        className,
      )}
    >
      {children}
    </div>
  );
}

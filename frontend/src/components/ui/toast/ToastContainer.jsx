// ToastContainer - stacks all the active toasts in the top-right corner.
import { Toast } from './Toast.jsx';

export function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    // pointer-events-none so the empty area doesn't block clicks on the page;
    // each Toast turns pointer events back on for itself.
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

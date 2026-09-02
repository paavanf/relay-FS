// DialogBackdrop - the dim layer behind the dialog panel.
// Clicking it closes the dialog.
export function DialogBackdrop({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

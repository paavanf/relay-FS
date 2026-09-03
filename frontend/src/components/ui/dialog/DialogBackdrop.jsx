// DialogBackdrop - the blurred dim layer behind the dialog panel.
// Clicking it closes the dialog.
export function DialogBackdrop({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-void/70 backdrop-blur-md"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

// DialogBackdrop - dims and lightly blurs the page behind a dialog.
// Clicking it closes the dialog.
export function DialogBackdrop({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-ink/20 backdrop-blur-[2px]"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

// Dialog - a modal popup.
//
// We render nothing at all when `isOpen` is false. That keeps this simple:
// no animations, no portals, no focus-trap library. Pressing Escape or
// clicking the backdrop closes it.

import { useEffect } from 'react';
import { DialogBackdrop } from './DialogBackdrop.jsx';

export function Dialog({ isOpen, onClose, children }) {
  // Listen for the Escape key while the dialog is open.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: remove the listener when the dialog closes or unmounts.
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <DialogBackdrop onClose={onClose} />
      {children}
    </div>
  );
}

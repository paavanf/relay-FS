// Dialog - a modal popup.
//
// We render nothing at all when `isOpen` is false. That keeps this simple:
// no animations, no portals, no focus-trap library. Pressing Escape or
// clicking the backdrop closes it.
//
// Every dialog is named by its DialogTitle: the dialog's aria-labelledby
// points at the title's id (made here with useId, handed down by context),
// so a screen reader says the title when the dialog opens.
// dialogNames.test.js checks that every dialog in the app has a title.

import { useEffect, useId } from 'react';
import { DialogBackdrop } from './DialogBackdrop.jsx';
import { DialogTitleIdContext } from './dialogTitleId.js';

export function Dialog({ isOpen, onClose, children }) {
  const titleId = useId();

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <DialogBackdrop onClose={onClose} />
      <DialogTitleIdContext.Provider value={titleId}>{children}</DialogTitleIdContext.Provider>
    </div>
  );
}

// ToastProvider - lets any component pop up a small notification.
//
// Call showToast({ type, title, message }) from anywhere. Toasts remove
// themselves after 5 seconds.

import { useState } from 'react';
import { ToastContext } from './ToastContext.js';
import { ToastContainer } from './ToastContainer.jsx';

// Counter used to give every toast a unique id.
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function removeToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function showToast({ type = 'info', title, message }) {
    const id = nextId;
    nextId = nextId + 1;

    setToasts((current) => [...current, { id, type, title, message }]);

    // Auto-dismiss after 5 seconds.
    setTimeout(() => removeToast(id), 5000);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export default ToastProvider;

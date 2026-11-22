// OfflineBanner - a small note at the foot of the screen while the browser is
// offline. Without it, a page waiting for data while offline is a mystery:
// requests pause rather than fail (TanStack Query's default) and carry on by
// themselves once the connection is back. Read out politely, not as an alarm,
// like the server-waking banner at the top.
import { useSyncExternalStore } from 'react';

function subscribe(onChange) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

const isOffline = () => !navigator.onLine;

export function OfflineBanner() {
  const offline = useSyncExternalStore(subscribe, isOffline, () => false);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {offline && (
        <p className="rounded-full border border-line-subtle bg-surface-overlay px-4 py-2 text-body-sm text-content-primary elevation-md">
          You are offline. Relay will carry on when you are back online.
        </p>
      )}
    </div>
  );
}

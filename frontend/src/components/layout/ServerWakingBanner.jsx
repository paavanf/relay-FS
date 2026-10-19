// ServerWakingBanner - a small note at the top of the screen while the
// server wakes up after a quiet spell (lib/slowRequests.js decides when).
// Non-blocking: nothing behind it is covered or disabled, and it goes as
// soon as the server answers. Read out politely, not as an alarm.
import { useSyncExternalStore } from 'react';
import { subscribe, isWaking } from '../../lib/slowRequests.js';
import { Spinner } from '../ui/Spinner.jsx';

export function ServerWakingBanner() {
  const waking = useSyncExternalStore(subscribe, isWaking, () => false);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center px-4">
      {waking && (
        <p className="flex items-center gap-2 rounded-full border border-line-subtle bg-surface-overlay px-4 py-2 text-body-sm text-content-primary elevation-md">
          <Spinner size="sm" className="text-brand-solid" />
          Starting the server, this can take a moment
        </p>
      )}
    </div>
  );
}

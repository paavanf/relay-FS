// SwapUpdates - what has happened to the swaps someone is in, newest first:
// a swap proposed to them, someone accepting or declining, a manager's
// decision, a swap done or one that could not be. Their own notifications
// only; the full notification centre arrives in Milestone 9.
import { DateTime } from 'luxon';
import { Bell } from 'lucide-react';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useNotifications } from '../../features/swaps/hooks/useSwapChains.js';

const SHOWN = 8;

export function SwapUpdates() {
  const { orgId } = useOrg();
  const notifications = useNotifications(orgId);
  const latest = (notifications.data ?? []).slice(0, SHOWN);
  if (latest.length === 0) return null;

  return (
    <section aria-label="Updates">
      <h2 className="text-h3 text-content-primary">Updates</h2>
      <ul className="mt-2 divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface-raised">
        {latest.map((notification) => (
          <li key={notification.id} className="flex gap-3 px-4 py-3">
            <Bell className="mt-0.5 size-4 shrink-0 text-content-tertiary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-body-sm text-content-primary">{notification.message}</p>
              <p className="mt-0.5 text-xs text-content-tertiary">{DateTime.fromISO(notification.createdAt).toRelative()}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// NotificationPanel - the latest notifications, opened from the bell, with
// "Mark all as read" and "View all". Clicking one opens its page, marks it
// read and closes the panel.
//
// Focus stays inside while it is open, and Escape - or a click outside -
// closes it (useFocusTrap.js). A dropdown under the bell on a wide screen;
// a full-width sheet under the top bar on a phone.
import { useId, useRef } from 'react';
import { Link } from 'react-router';
import { Button } from '../../../components/ui/Button.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { Skeleton } from '../../../components/ui/Skeleton.jsx';
import { useFocusTrap } from '../../../hooks/useFocusTrap.js';
import { useOrg } from '../../organisation/useOrg.js';
import { useLatestNotifications, useMarkAllRead } from '../hooks/useNotifications.js';
import { NotificationItem } from './NotificationItem.jsx';

export function NotificationPanel({ onClose }) {
  const { orgId } = useOrg();
  const latest = useLatestNotifications(orgId);
  const markAll = useMarkAllRead(orgId);
  const panel = useRef(null);
  const titleId = useId();
  useFocusTrap(panel, onClose);

  const notifications = latest.data?.notifications ?? [];
  const anyUnread = notifications.some((n) => !n.read);

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-x-0 top-14 z-40 max-h-[80vh] overflow-y-auto border-b border-line-subtle bg-surface-overlay elevation-md sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96 sm:rounded-lg sm:border"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line-subtle px-4 py-2.5">
          <h2 id={titleId} className="text-body-sm font-semibold text-content-primary">
            Notifications
          </h2>
          <Button variant="ghost" size="sm" disabled={!anyUnread} isLoading={markAll.isPending} onClick={() => markAll.mutate()}>
            Mark all as read
          </Button>
        </div>

        {latest.isPending && <Skeleton className="m-4 h-24" />}
        {latest.error && <ErrorState title="Could not load notifications" message={latest.error.message} onRetry={() => latest.refetch()} className="m-4" />}
        {latest.data && notifications.length === 0 && (
          <p className="px-4 py-8 text-center text-body-sm text-content-secondary">You&apos;re all caught up.</p>
        )}
        {notifications.length > 0 && (
          <ul className="divide-y divide-line-subtle">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onOpen={onClose} />
            ))}
          </ul>
        )}

        <div className="border-t border-line-subtle px-4 py-2.5">
          <Link to={`/app/${orgId}/notifications`} onClick={onClose} className="text-body-sm font-medium text-brand-content underline-offset-2 hover:underline">
            View all
          </Link>
        </div>
      </div>
    </>
  );
}

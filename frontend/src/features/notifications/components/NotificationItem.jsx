// NotificationItem - one notification: its sentence and how long ago. While
// it is unread it has a dot and bold text - never colour alone - and a
// screen reader hears "Unread" first. The whole row links to the page it is
// about, and following that link marks it read.
import { Link } from 'react-router';
import { DateTime } from 'luxon';
import { cn } from '../../../lib/utils.js';
import { useOrg } from '../../organisation/useOrg.js';
import { useMarkRead } from '../hooks/useNotifications.js';

export function NotificationItem({ notification, onOpen }) {
  const { orgId } = useOrg();
  const markRead = useMarkRead(orgId);
  const unread = !notification.read;

  function open() {
    if (unread) markRead.mutate(notification.id);
    onOpen?.();
  }

  return (
    <li>
      <Link
        to={notification.link ?? `/app/${orgId}/notifications`}
        onClick={open}
        className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-focus"
      >
        <span aria-hidden="true" className={cn('mt-1.5 size-2 shrink-0 rounded-full', unread ? 'bg-brand-solid' : 'bg-transparent')} />
        <span className="min-w-0">
          <span className={cn('block text-body-sm', unread ? 'font-semibold text-content-primary' : 'text-content-secondary')}>
            {unread && <span className="sr-only">Unread: </span>}
            {notification.message}
          </span>
          <span className="mt-0.5 block text-xs text-content-tertiary">{DateTime.fromISO(notification.createdAt).toRelative()}</span>
        </span>
      </Link>
    </li>
  );
}

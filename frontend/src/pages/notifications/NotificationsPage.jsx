// NotificationsPage - every notification someone has had in this
// organisation, newest first, twenty at a time ("Show older" fetches the
// next page by cursor, so a new arrival never shuffles the list). Unread ones
// have a dot and bold text; following one opens its page and marks it read.
import { BellOff } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useNotificationPages, useMarkAllRead } from '../../features/notifications/hooks/useNotifications.js';
import { NotificationItem } from '../../features/notifications/components/NotificationItem.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function NotificationsPage() {
  const { orgId } = useOrg();
  useDocumentTitle('Notifications');
  const { showToast } = useToast();
  const pages = useNotificationPages(orgId);
  const markAll = useMarkAllRead(orgId);
  const notifications = pages.data?.pages.flatMap((page) => page.notifications) ?? [];

  const markAllRead = () =>
    markAll.mutate(undefined, { onSuccess: () => showToast({ type: 'success', title: 'Marked all as read' }) });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifications" description="What has happened to your shifts, swaps and team, newest first." />

      <div className="mt-6 space-y-4">
        {pages.isPending && <Skeleton className="h-64 w-full" />}
        {pages.error && <ErrorState message={pages.error.message} onRetry={pages.refetch} />}
        {pages.data && notifications.length === 0 && (
          <Card>
            <EmptyState icon={BellOff} title="You're all caught up" description="When a roster is published or a swap needs you, it shows up here." />
          </Card>
        )}

        {notifications.length > 0 && (
          <>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" isLoading={markAll.isPending} disabled={!notifications.some((n) => !n.read)} onClick={markAllRead}>
                Mark all as read
              </Button>
            </div>
            <ul className="divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface-raised">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </ul>
            {pages.hasNextPage && (
              <Button variant="secondary" className="w-full sm:w-auto" isLoading={pages.isFetchingNextPage} onClick={() => pages.fetchNextPage()}>
                Show older
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;

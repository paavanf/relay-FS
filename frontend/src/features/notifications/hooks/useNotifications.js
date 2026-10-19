// useNotifications.js
// Someone's notifications, kept fresh by asking - no websockets.
//
//   useUnreadCount           the bell's number: every 30 seconds while the tab
//                            is visible (polling pauses when it is hidden),
//                            and again whenever the window regains focus
//   useLatestNotifications   the bell's panel: fetched each time it opens
//   useNotificationPages     the Notifications page, a page at a time
//   useMarkRead / useMarkAllRead   then everything above is fetched again,
//                            so the bell, the panel and the page agree

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../api/notifications.js';

export const notificationKeys = {
  all: (orgId) => ['notifications', orgId],
  count: (orgId) => ['notifications', orgId, 'count'],
  latest: (orgId) => ['notifications', orgId, 'latest'],
  pages: (orgId) => ['notifications', orgId, 'pages'],
};

export const PANEL_SIZE = 8;

export function useUnreadCount(orgId) {
  return useQuery({
    queryKey: notificationKeys.count(orgId),
    queryFn: () => getUnreadCount(orgId),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
}

export function useLatestNotifications(orgId) {
  return useQuery({ queryKey: notificationKeys.latest(orgId), queryFn: () => listNotifications(orgId, { limit: PANEL_SIZE }), staleTime: 0 });
}

export function useNotificationPages(orgId) {
  return useInfiniteQuery({
    queryKey: notificationKeys.pages(orgId),
    queryFn: ({ pageParam }) => listNotifications(orgId, { cursor: pageParam, limit: 20 }),
    initialPageParam: null,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

function useRefreshingMutation(orgId, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all(orgId) }) });
}

export function useMarkRead(orgId) {
  return useRefreshingMutation(orgId, (notificationId) => markNotificationRead(orgId, notificationId));
}

export function useMarkAllRead(orgId) {
  return useRefreshingMutation(orgId, () => markAllNotificationsRead(orgId));
}

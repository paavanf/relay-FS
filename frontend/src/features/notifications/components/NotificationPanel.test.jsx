// @vitest-environment jsdom
// NotificationPanel.test.jsx
// The bell's panel, rendered in a browser-like DOM with the API replaced by
// stand-ins: unread items marked by more than colour, the empty state, and
// marking read - one when it is opened, or all of them at once.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, configure } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { OrgContext } from '../../organisation/OrgContext.jsx';
import * as api from '../api/notifications.js';
import { NotificationBell } from './NotificationBell.jsx';

vi.mock('../api/notifications.js', () => ({
  getUnreadCount: vi.fn(),
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(async () => ({})),
  markAllNotificationsRead: vi.fn(async () => 0),
}));

const notice = (id, read, message) => ({ id, read, message, type: 'swap_proposed', link: `/app/org-1/swaps?chain=${id}`, createdAt: new Date().toISOString() });

function renderBell({ count, notifications = [] }) {
  api.getUnreadCount.mockResolvedValue(count);
  api.listNotifications.mockResolvedValue({ notifications, nextCursor: null });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrgContext.Provider value={{ orgId: 'org-1', orgName: 'Ward 4B', orgTimezone: 'UTC', role: 'member', isManager: false }}>
          <NotificationBell />
        </OrgContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openPanel(count) {
  fireEvent.click(await screen.findByRole('button', { name: count ? `Notifications, ${count} unread` : 'Notifications' }));
  return screen.findByRole('dialog', { name: 'Notifications' });
}

configure({ asyncUtilTimeout: 5000 }); // a fresh DOM's first render can be slow

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('the notification panel', () => {
  it('marks unread ones with a dot, bold text and "Unread" - never colour alone - and says when all are read', async () => {
    renderBell({ count: 1, notifications: [notice('n1', false, 'Wren proposed a swap.'), notice('n2', true, 'The swap is done.')] });
    await openPanel(1);
    const unread = (await screen.findByText('Wren proposed a swap.')).closest('span');
    expect(unread.textContent).toBe('Unread: Wren proposed a swap.');
    expect(unread.className).toContain('font-semibold');
    expect(screen.getByText('The swap is done.').closest('span').textContent).toBe('The swap is done.');
    cleanup();

    renderBell({ count: 0, notifications: [] });
    await openPanel(0);
    expect(await screen.findByText("You're all caught up.")).toBeTruthy();
  });

  it('marks one read when it is opened, and every one with "Mark all as read"', async () => {
    renderBell({ count: 1, notifications: [notice('n1', false, 'Wren proposed a swap.'), notice('n2', true, 'The swap is done.')] });
    await openPanel(1);
    fireEvent.click(await screen.findByText('Wren proposed a swap.'));
    await waitFor(() => expect(api.markNotificationRead).toHaveBeenCalledWith('org-1', 'n1'));
    expect(screen.queryByRole('dialog')).toBeNull();

    await openPanel(1);
    fireEvent.click(await screen.findByText('The swap is done.'));
    expect(api.markNotificationRead).toHaveBeenCalledTimes(1);

    await openPanel(1);
    fireEvent.click(await screen.findByRole('button', { name: 'Mark all as read' }));
    await waitFor(() => expect(api.markAllNotificationsRead).toHaveBeenCalledWith('org-1'));
  });
});

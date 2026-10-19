// @vitest-environment jsdom
// NotificationBell.test.jsx
// The bell, rendered in a browser-like DOM with the API replaced by
// stand-ins: the unread count and "9+", and its panel opening with focus
// kept inside and Escape handing focus back to the bell. What the panel
// shows, and marking read, are in NotificationPanel.test.jsx.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, configure } from '@testing-library/react';
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

// The first render in a fresh DOM can take a few seconds on a busy machine.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('the notification bell', () => {
  it('shows how many are unread - "9+" above nine - and its name says the whole count', async () => {
    renderBell({ count: 3 });
    expect((await screen.findByRole('button', { name: 'Notifications, 3 unread' })).textContent).toBe('3');
    cleanup();

    renderBell({ count: 12 });
    expect((await screen.findByRole('button', { name: 'Notifications, 12 unread' })).textContent).toBe('9+');
  });

  it('opens the latest, keeps focus inside, and closes with Escape - focus back on the bell', async () => {
    renderBell({ count: 1, notifications: [notice('n1', false, 'Wren proposed a swap.'), notice('n2', true, 'The swap is done.')] });
    const panel = await openPanel(1);
    await screen.findByText('Wren proposed a swap.');
    expect(panel.contains(document.activeElement)).toBe(true);

    const focusable = panel.querySelectorAll('a[href], button:not([disabled])');
    focusable[focusable.length - 1].focus();
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(document.activeElement).toBe(focusable[0]);

    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Notifications, 1 unread' }));
  });
});

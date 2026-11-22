// @vitest-environment jsdom
// OfflineBanner.test.jsx
// The note at the foot of the screen appears when the browser goes offline
// and goes again when it is back - following the browser's own online and
// offline events.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { OfflineBanner } from './OfflineBanner.jsx';

const NOTE = 'You are offline. Relay will carry on when you are back online.';

function goOnline(online) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
  act(() => window.dispatchEvent(new Event(online ? 'online' : 'offline')));
}

afterEach(() => {
  goOnline(true);
  cleanup();
});

describe('the offline banner', () => {
  it('says nothing while online', () => {
    render(<OfflineBanner />);
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it('appears when the browser goes offline, and goes when it is back', () => {
    render(<OfflineBanner />);
    goOnline(false);
    expect(screen.getByRole('status').textContent).toBe(NOTE);
    goOnline(true);
    expect(screen.queryByText(NOTE)).toBeNull();
  });
});

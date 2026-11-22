// @vitest-environment jsdom
// RouteErrorPage.test.jsx
// A page whose code could not be downloaded - offline - says so in plain
// words, without the browser's message, and reloads by itself once the
// connection is back. A real crash keeps its own wording and message.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { reloadPage } from '../../lib/reloadPage.js';
import RouteErrorPage from './RouteErrorPage.jsx';

vi.mock('../../lib/reloadPage.js', () => ({ reloadPage: vi.fn() }));

const RAW = 'Failed to fetch dynamically imported module: http://localhost/assets/index-abc.js';

function renderFailure(message) {
  const Fails = () => {
    throw new Error(message);
  };
  const router = createMemoryRouter([{ path: '/', element: <Fails />, errorElement: <RouteErrorPage /> }]);
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  vi.mocked(reloadPage).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('the route error page', () => {
  it('says a page could not load, without the raw message, and reloads once back online', () => {
    renderFailure(RAW);

    expect(screen.getByRole('heading', { level: 1, name: 'This page could not be loaded' })).toBeTruthy();
    expect(screen.queryByText(RAW)).toBeNull();
    act(() => window.dispatchEvent(new Event('online')));
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it('keeps the crash wording and message for a real bug, and does not reload by itself', () => {
    renderFailure('A bug while rendering');

    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong on this page' })).toBeTruthy();
    expect(screen.getByText('A bug while rendering')).toBeTruthy();
    act(() => window.dispatchEvent(new Event('online')));
    expect(reloadPage).not.toHaveBeenCalled();
  });
});

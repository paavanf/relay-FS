// @vitest-environment jsdom
// routeErrors.test.jsx
// No blank pages: an address that matches nothing shows the 404 page, and a
// page that crashes while rendering shows the route error page, with "Try
// again" - never a white screen. And every route in the app's own router
// sits under an errorElement, so no page can crash past one.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import NotFoundPage from '../pages/notFound/NotFoundPage.jsx';
import RouteErrorPage from '../pages/routeError/RouteErrorPage.jsx';
import { router } from './router.jsx';

function Crashes() {
  throw new Error('A bug while rendering');
}

function renderAt(path) {
  const routes = [
    { path: '/', element: <Crashes />, errorElement: <RouteErrorPage /> },
    { path: '*', element: <NotFoundPage /> },
  ];
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

// Routes with no errorElement of their own or above them.
function unguarded(routes, guarded = false, trail = '') {
  return routes.flatMap((route) => {
    const here = guarded || Boolean(route.errorElement);
    const name = `${trail}/${route.path ?? (route.index ? '(index)' : '(layout)')}`;
    return [...(here ? [] : [name]), ...unguarded(route.children ?? [], here, name)];
  });
}

afterEach(cleanup);

describe('when a page cannot be shown', () => {
  it('shows the 404 page for an address that matches nothing', () => {
    renderAt('/no-such-page');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
  });

  it('shows the route error page, with Try again, when a page crashes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong on this page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    vi.mocked(console.error).mockRestore();
  });

  it("guards every route in the app's router with an errorElement", () => {
    expect(router.routes.length).toBeGreaterThan(0);
    expect(unguarded(router.routes)).toEqual([]);
  });
});

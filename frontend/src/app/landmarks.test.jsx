// @vitest-environment jsdom
// landmarks.test.jsx
// Every page has exactly one main landmark - where a screen reader's "skip
// to main content" goes - and nothing loose outside the landmarks: the
// signed-out layout (its logo row is the banner), the 404 and 403 pages, and
// a crashed page, both when it fills the window (the router wraps it in a
// <main>) and inside the app, where AppLayout's <main> already holds it. The
// e2e accessibility check (e2e/specs/03-axe.spec.js) runs axe's own rules
// for this on the built pages.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import PublicLayout from '../components/layout/PublicLayout/PublicLayout.jsx';
import NotFoundPage from '../pages/notFound/NotFoundPage.jsx';
import ForbiddenPage from '../pages/forbidden/ForbiddenPage.jsx';
import { ThemeContext } from '../features/theme/ThemeContext.js';
import { router } from './router.jsx';

function Crashes() {
  throw new Error('A bug while rendering');
}

const theme = { preference: 'light', resolvedTheme: 'light', setPreference: () => {} };
const renderRoutes = (routes) =>
  render(
    <ThemeContext.Provider value={theme}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />
    </ThemeContext.Provider>,
  );

// The router's two crash pages: one for a page of its own, one inside the app.
const standalone = router.routes.find((route) => route.path === '/').errorElement;
const orgRoute = router.routes.find((route) => route.path === '/app').children.find((route) => route.path === ':orgId');
const inApp = orgRoute.children[0].errorElement;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('landmarks', () => {
  it('give the signed-out pages a banner for the logo row, and one main for the form', async () => {
    renderRoutes([{ element: <PublicLayout />, children: [{ path: '/', element: <h1>Sign in</h1> }] }]);
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main').textContent).toContain('Sign in');
  });

  it('give the 404 and 403 pages one main each', () => {
    for (const Page of [NotFoundPage, ForbiddenPage]) {
      renderRoutes([{ path: '/', element: <Page /> }]);
      expect(screen.getAllByRole('main'), Page.name).toHaveLength(1);
      cleanup();
    }
  });

  it('give a crashed page one main: its own when it fills the window, none extra inside the app', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderRoutes([{ path: '/', element: <Crashes />, errorElement: standalone }]);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    cleanup();

    renderRoutes([{ path: '/', element: <Crashes />, errorElement: inApp }]);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.queryAllByRole('main')).toHaveLength(0);
  });
});

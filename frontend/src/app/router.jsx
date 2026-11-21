// The app's route table, built with React Router's data router API.
//
// Guards are "layout routes": RequireAuth / RequireGuest render an <Outlet />
// for their children, so wrapping a group of routes is just a matter of
// nesting them underneath. Pages load on demand (lazyPages.js); the pages
// themselves are listed in publicRoutes.jsx and appRoutes.jsx.
//
// Every group has an errorElement: a page that crashes shows a message with
// "Try again" in its own place - inside the app, the sidebar and top bar
// stay - instead of a white screen.

import { createBrowserRouter } from 'react-router';
import RequireAuth from '../features/auth/RequireAuth.jsx';
import RequireGuest from '../features/auth/RequireGuest.jsx';
import OrgProvider from '../features/organisation/OrgProvider.jsx';
import RootRedirect from '../pages/RootRedirect/index.js';
import RouteErrorPage from '../pages/routeError/RouteErrorPage.jsx';
import * as Page from './lazyPages.js';
import { guestPages, linkPages } from './publicRoutes.jsx';
import { appPages } from './appRoutes.jsx';

const failed = <RouteErrorPage />;

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect />, errorElement: failed },
  // Open to everyone, signed in or not: Google's consent screen links here.
  { path: '/privacy', element: <Page.PrivacyPage />, errorElement: failed },
  { element: <RequireGuest />, errorElement: failed, children: guestPages },
  { element: <Page.PublicLayout />, errorElement: failed, children: linkPages },

  // Everything below here needs a logged-in user. OrgProvider resolves
  // :orgId to a membership (or redirects to /403); AppLayout draws the shell.
  {
    path: '/app',
    element: <RequireAuth />,
    errorElement: failed,
    children: [
      { index: true, element: <Page.OrgSelectorPage /> },
      {
        path: ':orgId',
        element: (
          <OrgProvider>
            <Page.AppLayout />
          </OrgProvider>
        ),
        children: [{ errorElement: failed, children: appPages }],
      },
    ],
  },

  { path: '/403', element: <Page.ForbiddenPage />, errorElement: failed },
  { path: '*', element: <Page.NotFoundPage />, errorElement: failed },
]);

export default router;

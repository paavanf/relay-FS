// The app's route table, built with React Router's data router API.
//
// Guards are used as "layout routes": RequireAuth / RequireGuest / RequireRole
// render an <Outlet /> for their children, so wrapping a group of routes is
// just a matter of nesting them underneath.

import { createBrowserRouter, Navigate } from 'react-router';

import RequireAuth from '../features/auth/RequireAuth.jsx';
import RequireGuest from '../features/auth/RequireGuest.jsx';
import RequireRole from '../features/auth/RequireRole.jsx';
import OrgProvider from '../features/organisation/OrgProvider.jsx';

import PublicLayout from '../components/layout/PublicLayout/index.js';
import AppLayout from '../components/layout/AppLayout/index.js';

import RootRedirect from '../pages/RootRedirect/index.js';
import LoginPage from '../pages/auth/login/index.js';
import RegisterPage from '../pages/auth/register/index.js';
import AcceptInvitePage from '../pages/auth/acceptInvite/index.js';
import ForgotPasswordPage from '../pages/auth/forgotPassword/index.js';
import ResetPasswordPage from '../pages/auth/resetPassword/index.js';
import OrgSelectorPage from '../pages/orgSelector/index.js';
import SchedulePage from '../pages/schedule/index.js';
import MyShiftsPage from '../pages/myShifts/index.js';
import AvailabilityPage from '../pages/availability/index.js';
import SwapsPage from '../pages/swaps/index.js';
import SwapApprovalsPage from '../pages/swapApprovals/index.js';
import FairnessPage from '../pages/fairness/index.js';
import TeamPage from '../pages/team/index.js';
import SettingsPage from '../pages/settings/index.js';
import ForbiddenPage from '../pages/forbidden/index.js';
import NotFoundPage from '../pages/notFound/index.js';

// Only managers and owners may open these pages.
const MANAGER_ROLES = ['manager', 'owner'];

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },

  // Logged-out pages. A logged-in user gets bounced away from these.
  {
    element: <RequireGuest />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },

  // Public, and deliberately NOT behind RequireGuest: someone already signed
  // in on this browser must still be able to open an invite or a reset link
  // from their email rather than being redirected into the app.
  {
    element: <PublicLayout />,
    children: [
      { path: '/invite/:token', element: <AcceptInvitePage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password/:token', element: <ResetPasswordPage /> },
    ],
  },

  // Everything below here needs a logged-in user.
  {
    path: '/app',
    element: <RequireAuth />,
    children: [
      { index: true, element: <OrgSelectorPage /> },
      {
        path: ':orgId',
        // OrgProvider resolves :orgId to a membership (or redirects to /403),
        // then AppLayout draws the sidebar and renders the page.
        element: (
          <OrgProvider>
            <AppLayout />
          </OrgProvider>
        ),
        children: [
          { index: true, element: <Navigate to="schedule" replace /> },
          { path: 'schedule', element: <SchedulePage /> },
          { path: 'my-shifts', element: <MyShiftsPage /> },
          { path: 'availability', element: <AvailabilityPage /> },
          { path: 'swaps', element: <SwapsPage /> },
          { path: 'fairness', element: <FairnessPage /> },

          // Manager-only corner of the app.
          {
            element: <RequireRole roles={MANAGER_ROLES} />,
            children: [
              { path: 'swaps/approvals', element: <SwapApprovalsPage /> },
              { path: 'team', element: <TeamPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);

export default router;

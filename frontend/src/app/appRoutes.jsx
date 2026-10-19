// appRoutes.jsx
// The pages of the signed-in app, under /app/:orgId. The manager-only corner
// sits behind RequireRole; the server enforces the same roles on every
// request, so this only decides what is shown.

import { Navigate } from 'react-router';
import RequireRole from '../features/auth/RequireRole.jsx';
import * as Page from './lazyPages.js';

// Only managers and owners may open these pages.
const MANAGER_ROLES = ['manager', 'owner'];

export const appPages = [
  { index: true, element: <Navigate to="schedule" replace /> },
  { path: 'schedule', element: <Page.SchedulePage /> },
  { path: 'my-shifts', element: <Page.MyShiftsPage /> },
  { path: 'availability', element: <Page.AvailabilityPage /> },
  { path: 'swaps', element: <Page.SwapsPage /> },
  { path: 'fairness', element: <Page.FairnessPage /> },
  { path: 'notifications', element: <Page.NotificationsPage /> },
  { path: 'preferences', element: <Page.PreferencesPage /> },
  {
    element: <RequireRole roles={MANAGER_ROLES} />,
    children: [
      { path: 'swaps/approvals', element: <Page.SwapApprovalsPage /> },
      { path: 'team', element: <Page.TeamPage /> },
      { path: 'settings', element: <Page.SettingsPage /> },
    ],
  },
];

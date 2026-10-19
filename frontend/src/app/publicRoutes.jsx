// publicRoutes.jsx
// The signed-out pages, each with the split public layout:
//
//   guestPages   login and register - a signed-in user is bounced away
//   linkPages    invites and password resets - deliberately NOT guest-only,
//                so someone already signed in on this browser can still open
//                a link from their email

import * as Page from './lazyPages.js';

export const guestPages = [
  {
    element: <Page.PublicLayout />,
    children: [
      { path: '/login', element: <Page.LoginPage /> },
      { path: '/register', element: <Page.RegisterPage /> },
    ],
  },
];

export const linkPages = [
  { path: '/invite/:token', element: <Page.AcceptInvitePage /> },
  { path: '/forgot-password', element: <Page.ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <Page.ResetPasswordPage /> },
];

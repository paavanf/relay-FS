// lazyPages.js
// Every page - and the signed-in app's shell - loaded only when it is first
// needed (React.lazy). Vite turns each import() below into a chunk of its
// own, so someone opening the landing page or the login screen downloads
// that page, not the whole app. The Suspense boundaries that show something
// while a chunk loads are in App.jsx and in each layout.

import { lazy } from 'react';

export const LandingPage = lazy(() => import('../pages/landing/index.js'));

export const PublicLayout = lazy(() => import('../components/layout/PublicLayout/index.js'));
export const LoginPage = lazy(() => import('../pages/auth/login/index.js'));
export const RegisterPage = lazy(() => import('../pages/auth/register/index.js'));
export const AcceptInvitePage = lazy(() => import('../pages/auth/acceptInvite/index.js'));
export const ForgotPasswordPage = lazy(() => import('../pages/auth/forgotPassword/index.js'));
export const ResetPasswordPage = lazy(() => import('../pages/auth/resetPassword/index.js'));
export const AuthCallbackPage = lazy(() => import('../pages/auth/callback/index.js'));

export const AppLayout = lazy(() => import('../components/layout/AppLayout/index.js'));
export const OrgSelectorPage = lazy(() => import('../pages/orgSelector/index.js'));
export const SchedulePage = lazy(() => import('../pages/schedule/index.js'));
export const MyShiftsPage = lazy(() => import('../pages/myShifts/index.js'));
export const AvailabilityPage = lazy(() => import('../pages/availability/index.js'));
export const SwapsPage = lazy(() => import('../pages/swaps/index.js'));
export const SwapApprovalsPage = lazy(() => import('../pages/swapApprovals/index.js'));
export const FairnessPage = lazy(() => import('../pages/fairness/index.js'));
export const NotificationsPage = lazy(() => import('../pages/notifications/index.js'));
export const PreferencesPage = lazy(() => import('../pages/preferences/index.js'));
export const TeamPage = lazy(() => import('../pages/team/index.js'));
export const SettingsPage = lazy(() => import('../pages/settings/index.js'));

export const ForbiddenPage = lazy(() => import('../pages/forbidden/index.js'));
export const NotFoundPage = lazy(() => import('../pages/notFound/index.js'));

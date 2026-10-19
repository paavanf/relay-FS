// RootRedirect - what you get when you visit "/".
// Logged in: straight into the app, exactly as before. Logged out: the
// landing page, which explains what Relay is and links to sign up or log in.
import { Navigate } from 'react-router';
import { useAuth } from '../../features/auth/useAuth.js';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader.jsx';
// Loaded on demand, like every page: a signed-in visitor never downloads it.
import { LandingPage } from '../../app/lazyPages.js';

function RootRedirect() {
  const { user, isLoading } = useAuth();

  // Only a tab with a session to restore waits here; see AuthProvider.
  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <LandingPage />;
}

export default RootRedirect;

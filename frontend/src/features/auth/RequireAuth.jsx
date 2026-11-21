// Route guard for pages that need a logged-in user.
// Used as a layout route, so it renders <Outlet /> for its child routes.
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './useAuth.js';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader.jsx';

function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Still restoring this browser's Supabase session - don't bounce the user to /login yet.
  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;

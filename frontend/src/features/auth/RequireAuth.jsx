// Route guard for pages that need a logged-in user.
// Used as a layout route, so it renders <Outlet /> for its child routes.
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './useAuth.js';
import { Spinner } from '../../components/ui/Spinner.jsx';

function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Still checking the refresh cookie - don't bounce the user to /login yet.
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;

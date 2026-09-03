// Route guard for login/register. If the user IS already logged in there is
// no point showing them a login form, so send them into the app.
import { Navigate, Outlet } from 'react-router';
import { useAuth } from './useAuth.js';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader.jsx';

function RequireGuest() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default RequireGuest;

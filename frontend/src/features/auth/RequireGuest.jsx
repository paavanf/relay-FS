// Route guard for login/register. If the user IS already logged in there is
// no point showing them a login form, so send them on: to the page they were
// heading for (a safe ?next=, such as an invite) or into the app.
//
// This also decides where a successful login lands. Signing in sets the user,
// which re-renders this guard before the form's own navigate() is seen, so
// both must agree on the destination - and both read it from useReturnPath.
import { Navigate, Outlet } from 'react-router';
import { useAuth } from './useAuth.js';
import { useReturnPath } from './useReturnPath.js';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader.jsx';

function RequireGuest() {
  const { user, isLoading } = useAuth();
  const { next } = useReturnPath();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return <Navigate to={next ?? '/app'} replace />;
  }

  return <Outlet />;
}

export default RequireGuest;

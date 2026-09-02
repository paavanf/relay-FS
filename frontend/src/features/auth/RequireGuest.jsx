// Route guard for login/register. If the user IS already logged in there is
// no point showing them a login form, so send them into the app.
import { Navigate, Outlet } from 'react-router';
import { useAuth } from './useAuth.js';
import { Spinner } from '../../components/ui/Spinner.jsx';

function RequireGuest() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default RequireGuest;

// RootRedirect - what you get when you visit "/".
// Sends you into the app if you're logged in, or to the login page if not.
import { Navigate } from 'react-router';
import { useAuth } from '../../features/auth/useAuth.js';
import { Spinner } from '../../components/ui/Spinner.jsx';

function RootRedirect() {
  const { user, isLoading } = useAuth();

  // Wait for the session check to finish before deciding where to go.
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default RootRedirect;

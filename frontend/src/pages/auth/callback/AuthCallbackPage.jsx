// AuthCallbackPage - /auth/callback, where Supabase sends people back: from
// the link in a sign-up confirmation email, and from Google.
//
// The sign-in itself was taken from the address before the app even
// rendered (lib/auth/authRedirect.js), and AuthProvider adopted it; this page
// waits for that, then sends the person on - to ?next= (an invite, say) when
// it is a safe path inside Relay, otherwise into the app. A link that did
// not work says why, and offers to send a new one by signing in again.
import { Navigate } from 'react-router';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useReturnPath } from '../../../features/auth/useReturnPath.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { authPath } from '../../../lib/returnPath.js';
import { LinkProblem } from './LinkProblem.jsx';

function AuthCallbackPage() {
  useDocumentTitle('Signing in');
  const { user, isLoading, link } = useAuth();
  const { next } = useReturnPath();

  if (isLoading) {
    return (
      <p role="status" className="flex items-center gap-2 text-body-sm text-content-secondary">
        <Spinner size="sm" />
        Signing you in…
      </p>
    );
  }

  if (user) return <Navigate to={next ?? '/app'} replace />;

  return (
    <LinkProblem title="This sign-in link did not work" reason={link?.error}>
      <ButtonLink to={authPath('/login', { next })} size="lg" className="w-full">
        Sign in
      </ButtonLink>
    </LinkProblem>
  );
}

export default AuthCallbackPage;

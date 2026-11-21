// ResetPasswordPage - /reset-password, the "choose a new password" step.
//
// The emailed reset link signs the person in (lib/auth/authRedirect.js and
// AuthProvider take it from the address) just long enough to choose a new
// password here. Without that sign-in the link has expired, or was used, so
// the page offers a fresh one. A shared demo account keeps the one password
// everyone uses, so it is told so instead of being offered the form.
import { Link } from 'react-router';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';
import { Callout } from '../../../components/ui/Callout.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { LinkProblem } from '../callback/LinkProblem.jsx';
import { ResetPasswordForm } from './ResetPasswordForm.jsx';

function ResetPasswordPage() {
  useDocumentTitle('Choose a new password');
  const { user, isLoading, link } = useAuth();

  if (isLoading) return <Spinner size="sm" />;

  if (!user) {
    return (
      <LinkProblem title="This reset link did not work" reason={link?.error}>
        <ButtonLink to="/forgot-password" size="lg" className="w-full">
          Send a new link
        </ButtonLink>
      </LinkProblem>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 text-content-primary">Choose a new password</h1>
        <p className="mt-1.5 text-sm text-content-secondary">For {user.email}.</p>
      </div>

      {user.isDemo ? (
        <Callout variant="info">This is a shared demo account. Everyone signs in to it with the same password, so it cannot be changed.</Callout>
      ) : (
        <ResetPasswordForm />
      )}

      <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
        <Link to="/app" className="font-medium text-brand-solid hover:text-brand-content">
          Go to Relay
        </Link>
      </p>
    </div>
  );
}

export default ResetPasswordPage;

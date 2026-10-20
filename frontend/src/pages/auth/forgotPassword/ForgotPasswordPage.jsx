// ForgotPasswordPage - the "email me a reset link" step. On a deployment
// that sends no email (useAppConfig) it says so instead of offering the form
// - and the server refuses the request either way (EMAIL_DISABLED).
import { Link } from 'react-router';
import { ForgotPasswordForm } from './ForgotPasswordForm.jsx';
import { NoEmailReset } from './NoEmailReset.jsx';
import { Skeleton } from '../../../components/ui/Skeleton.jsx';
import { useAppConfig } from '../../../features/config/useAppConfig.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function ForgotPasswordPage() {
  useDocumentTitle('Reset your password');
  const config = useAppConfig();
  const noEmail = config.data?.emailEnabled === false;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 tracking-[-0.01em] text-content-primary">Reset your password</h1>
        <p className="mt-1.5 text-sm text-content-secondary">
          {noEmail ? 'This deployment does not send email.' : 'We will email you a link to choose a new one.'}
        </p>
      </div>

      {config.isPending ? <Skeleton className="h-24 w-full" /> : noEmail ? <NoEmailReset /> : <ForgotPasswordForm />}

      <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
        <Link to="/login" className="font-medium text-brand-solid hover:text-brand-content">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;

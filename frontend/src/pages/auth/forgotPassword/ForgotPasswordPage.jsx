// ForgotPasswordPage - the "email me a reset link" step.
import { Link } from 'react-router';
import { ForgotPasswordForm } from './ForgotPasswordForm.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function ForgotPasswordPage() {
  useDocumentTitle('Reset your password');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 tracking-[-0.01em] text-content-primary">Reset your password</h1>
        <p className="mt-1.5 text-sm text-content-secondary">
          We will email you a link to choose a new one.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
        <Link to="/login" className="font-medium text-brand-solid hover:text-brand-content">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;

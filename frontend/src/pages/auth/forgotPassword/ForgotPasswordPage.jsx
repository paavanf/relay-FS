// ForgotPasswordPage - the "email me a reset link" step.
import { Link } from 'react-router';
import { ForgotPasswordForm } from './ForgotPasswordForm.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function ForgotPasswordPage() {
  useDocumentTitle('Reset your password');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">Reset your password</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          We will email you a link to choose a new one.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="mt-6 border-t border-line pt-3 text-[13px] text-ink-muted">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;

// ResetPasswordPage - the "choose a new password" step. The token comes from
// the URL, which is what the emailed link points at.
import { Link, useParams } from 'react-router';
import { ResetPasswordForm } from './ResetPasswordForm.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function ResetPasswordPage() {
  const { token } = useParams();
  useDocumentTitle('Choose a new password');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          This link works once, and expires an hour after it was sent.
        </p>
      </div>

      <ResetPasswordForm token={token} />

      <p className="mt-6 border-t border-line pt-3 text-[13px] text-ink-muted">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default ResetPasswordPage;

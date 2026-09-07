// ResetPasswordPage.jsx
// Container for the "choose a new password" step. The token comes from the
// URL, which is what the emailed link points at.
import { Link, useParams } from 'react-router';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { ResetPasswordForm } from './ResetPasswordForm.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function ResetPasswordPage() {
  const { token } = useParams();
  useDocumentTitle('Reset password');

  return (
    <Card tilt>
      <CardContent className="pt-8">
        <div className="mb-7">
          <h1 className="text-aurora text-2xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            This link works once, and expires an hour after it was sent.
          </p>
        </div>

        <ResetPasswordForm token={token} />

        <p className="mt-7 text-center text-sm text-ink-faint">
          <Link
            to="/login"
            className="font-medium text-indigo-300 transition-colors duration-300 hover:text-indigo-200"
          >
            Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default ResetPasswordPage;

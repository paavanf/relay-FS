// ForgotPasswordPage.jsx
// Container for the "email me a reset link" step.
import { Link } from 'react-router';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { ForgotPasswordForm } from './ForgotPasswordForm.jsx';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';

function ForgotPasswordPage() {
  useDocumentTitle('Forgot password');

  return (
    <Card tilt>
      <CardContent className="pt-8">
        <div className="mb-7">
          <h1 className="text-aurora text-2xl font-semibold tracking-tight">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Enter your email and we&apos;ll send you a link to choose a new one.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-7 text-center text-sm text-ink-faint">
          Remembered it?{' '}
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

export default ForgotPasswordPage;

// LoginFooter - the links under the login form.
import { Link } from 'react-router';

export function LoginFooter() {
  return (
    <div className="mt-6 space-y-3 text-body-sm">
      <p>
        <Link
          to="/forgot-password"
          className="text-content-secondary underline-offset-2 transition-colors hover:text-content-primary hover:underline"
        >
          Forgot your password?
        </Link>
      </p>

      <p className="border-t border-line-subtle pt-3 text-content-secondary">
        New to Relay?{' '}
        <Link to="/register" className="font-medium text-brand-solid hover:text-brand-content">
          Create an account
        </Link>
      </p>
    </div>
  );
}

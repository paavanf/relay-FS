// LoginFooter - the links under the login form.
import { Link } from 'react-router';

export function LoginFooter() {
  return (
    <div className="mt-6 space-y-3 text-[13px]">
      <p>
        <Link
          to="/forgot-password"
          className="text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
        >
          Forgot your password?
        </Link>
      </p>

      <p className="border-t border-line pt-3 text-ink-muted">
        New to Relay?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}

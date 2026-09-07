// LoginFooter - the "no account yet?" line under the login form.
import { Link } from 'react-router';

export function LoginFooter() {
  return (
    <div className="mt-7 space-y-3 text-center text-sm text-ink-faint">
      <p>
        <Link
          to="/forgot-password"
          className="font-medium text-indigo-300 transition-colors duration-300 hover:text-indigo-200"
        >
          Forgot password?
        </Link>
      </p>

      <p>
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-indigo-300 transition-colors duration-300 hover:text-indigo-200"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

// LoginFooter - the "no account yet?" line under the login form.
import { Link } from 'react-router';

export function LoginFooter() {
  return (
    <p className="mt-6 text-center text-sm text-slate-500">
      Don&apos;t have an account?{' '}
      <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
        Sign up
      </Link>
    </p>
  );
}

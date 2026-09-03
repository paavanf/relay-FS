// RegisterFooter - the "already registered?" line under the sign-up form.
import { Link } from 'react-router';

export function RegisterFooter() {
  return (
    <p className="mt-7 text-center text-sm text-ink-faint">
      Already have an account?{' '}
      <Link
        to="/login"
        className="font-medium text-indigo-300 transition-colors duration-300 hover:text-indigo-200"
      >
        Log in
      </Link>
    </p>
  );
}

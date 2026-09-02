// RegisterFooter - the "already registered?" line under the sign-up form.
import { Link } from 'react-router';

export function RegisterFooter() {
  return (
    <p className="mt-6 text-center text-sm text-slate-500">
      Already have an account?{' '}
      <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
        Log in
      </Link>
    </p>
  );
}

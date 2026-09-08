// RegisterFooter - the link under the sign-up form.
import { Link } from 'react-router';

export function RegisterFooter() {
  return (
    <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
      Already have an account?{' '}
      <Link to="/login" className="font-medium text-brand-solid hover:text-brand-content">
        Sign in
      </Link>
    </p>
  );
}

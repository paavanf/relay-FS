// RegisterFooter - the link under the sign-up form.
import { Link } from 'react-router';

export function RegisterFooter() {
  return (
    <p className="mt-6 border-t border-line pt-3 text-[13px] text-ink-muted">
      Already have an account?{' '}
      <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
        Sign in
      </Link>
    </p>
  );
}

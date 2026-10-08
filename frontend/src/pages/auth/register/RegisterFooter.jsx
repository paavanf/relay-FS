// RegisterFooter - the link under the sign-up form. It keeps any ?next= and
// invite email, so switching to sign in never loses the invite.
import { Link } from 'react-router';
import { authPath } from '../../../lib/returnPath.js';
import { useReturnPath } from '../../../features/auth/useReturnPath.js';

export function RegisterFooter() {
  const { next, email } = useReturnPath();

  return (
    <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
      Already have an account?{' '}
      <Link to={authPath('/login', { next, email })} className="font-medium text-brand-solid hover:text-brand-content">
        Sign in
      </Link>
    </p>
  );
}

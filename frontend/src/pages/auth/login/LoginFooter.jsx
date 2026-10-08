// LoginFooter - the links under the login form.
// "Create an account" keeps any ?next= and invite email, so someone who came
// from an invite and has no account yet still ends up back at the invite.
import { Link } from 'react-router';
import { authPath } from '../../../lib/returnPath.js';
import { useReturnPath } from '../../../features/auth/useReturnPath.js';

export function LoginFooter() {
  const { next, email } = useReturnPath();

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
        <Link to={authPath('/register', { next, email })} className="font-medium text-brand-solid hover:text-brand-content">
          Create an account
        </Link>
      </p>
    </div>
  );
}

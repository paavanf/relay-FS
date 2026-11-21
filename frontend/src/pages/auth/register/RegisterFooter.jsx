// RegisterFooter - the link under the sign-up form, and a small one to the
// privacy policy. It keeps any ?next= and invite email, so switching to sign
// in never loses the invite.
import { Link } from 'react-router';
import { authPath } from '../../../lib/returnPath.js';
import { useReturnPath } from '../../../features/auth/useReturnPath.js';
import { PrivacyLink } from '../../../components/PrivacyLink.jsx';

export function RegisterFooter() {
  const { next, email } = useReturnPath();

  return (
    <div className="mt-6 space-y-3 text-body-sm">
      <p className="border-t border-line-subtle pt-3 text-content-secondary">
        Already have an account?{' '}
        <Link to={authPath('/login', { next, email })} className="font-medium text-brand-solid hover:text-brand-content">
          Sign in
        </Link>
      </p>

      <p className="pt-3 text-xs">
        <PrivacyLink />
      </p>
    </div>
  );
}

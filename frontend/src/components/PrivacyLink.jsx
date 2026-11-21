// PrivacyLink - the small "Privacy" link to the privacy policy (/privacy),
// shown in the landing page's footer and under the sign-in and sign-up forms.
// className sets the size where it sits.
import { Link } from 'react-router';
import { cn } from '../lib/utils.js';

export function PrivacyLink({ className }) {
  return (
    <Link
      to="/privacy"
      className={cn(
        'rounded-sm text-content-secondary underline-offset-2 transition-colors hover:text-content-primary hover:underline',
        className,
      )}
    >
      Privacy
    </Link>
  );
}

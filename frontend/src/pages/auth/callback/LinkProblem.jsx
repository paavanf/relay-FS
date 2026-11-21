// LinkProblem - an emailed link, or a return from Google, that did not sign
// anyone in: expired, already used, or refused. Says so plainly - in
// Supabase's own words when it gave a reason - and offers a way on.
import { Link } from 'react-router';
import { MailX } from 'lucide-react';
import { InviteHeading } from '../acceptInvite/InviteHeading.jsx';

export function LinkProblem({ title, reason, children }) {
  return (
    <div>
      <InviteHeading icon={MailX} muted title={title}>
        {reason || 'The link may have expired, or been used already.'}
      </InviteHeading>

      <div className="mt-5">{children}</div>

      <p className="mt-6 border-t border-line-subtle pt-3 text-body-sm text-content-secondary">
        <Link to="/login" className="font-medium text-brand-solid hover:text-brand-content">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

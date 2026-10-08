// InviteSignedOut - an invite opened by someone who is not signed in.
//
// Says who invited them to what, then offers both ways in. Each link carries
// the invite in ?next=, so signing in or registering ends back here, and
// pre-fills the address the invite was sent to.
import { MailCheck } from 'lucide-react';
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';
import { authPath } from '../../../lib/returnPath.js';
import { InviteHeading } from './InviteHeading.jsx';
import { InviteSummary } from './InviteSummary.jsx';
import { withArticle, invitePath } from './inviteWords.js';

export function InviteSignedOut({ invite, token }) {
  const carry = { next: invitePath(token), email: invite.email };

  return (
    <div>
      <InviteHeading icon={MailCheck} title={`Join ${invite.orgName}`}>
        {invite.inviterName || 'Someone'} has invited you to join as {withArticle(invite.role)}.
      </InviteHeading>

      <InviteSummary invite={invite} />

      <p className="mt-5 text-body-sm text-content-secondary">
        Log in or create an account with{' '}
        <span className="font-medium text-content-primary">{invite.email}</span> to accept. The
        invite only works for that address.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ButtonLink to={authPath('/register', carry)} size="lg" className="w-full">
          Create account
        </ButtonLink>
        <ButtonLink to={authPath('/login', carry)} variant="secondary" size="lg" className="w-full">
          Log in
        </ButtonLink>
      </div>
    </div>
  );
}

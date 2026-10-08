// AcceptInvitePage - where an invite link lands.
//
// Five states, decided in this order:
//   loading       the invite, and any saved session, are still being looked up
//   invalid       expired, used, withdrawn or unknown (InviteUnavailable)
//   signed out    who invited them to what, then Log in or Create account
//   right person  signed in with the invited address: one button to join
//   wrong person  signed in as someone else: whose invite it is, and a switch
//
// The route sits outside RequireGuest on purpose, so someone already signed
// in on this browser can still open an invite from their email.
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { useAuth } from '../../../features/auth/useAuth.js';
import { previewInvite } from '../../../features/organisation/api/invites.js';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle.js';
import { InviteUnavailable } from './InviteUnavailable.jsx';
import { InviteSignedOut } from './InviteSignedOut.jsx';
import { InviteJoin } from './InviteJoin.jsx';
import { InviteWrongAccount } from './InviteWrongAccount.jsx';

function AcceptInvitePage() {
  const { token } = useParams();
  const { user, isLoading } = useAuth();
  useDocumentTitle('Invite');

  const preview = useQuery({
    queryKey: ['invite', token],
    queryFn: () => previewInvite(token),
    // A dead link stays dead; asking again would only delay saying so.
    retry: false,
  });

  if (isLoading || preview.isPending) {
    return (
      <p role="status" className="flex items-center gap-2 text-body-sm text-content-secondary">
        <Spinner size="sm" />
        Checking your invite…
      </p>
    );
  }

  if (preview.isError) return <InviteUnavailable error={preview.error} onRetry={preview.refetch} />;

  const invite = preview.data;

  if (!user) return <InviteSignedOut invite={invite} token={token} />;

  if (user.email.toLowerCase() === invite.email.toLowerCase()) {
    return <InviteJoin invite={invite} token={token} onGone={preview.refetch} />;
  }

  return <InviteWrongAccount invite={invite} userEmail={user.email} />;
}

export default AcceptInvitePage;

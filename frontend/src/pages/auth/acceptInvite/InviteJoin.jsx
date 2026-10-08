// InviteJoin - signed in with the address the invite was sent to, so all that
// is left is one button.
//
// The new membership goes into the auth context before navigating: the
// org's Schedule is behind OrgProvider, which looks the org up in that list
// and would otherwise bounce to /403.
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { MailCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Callout } from '../../../components/ui/Callout.jsx';
import { useToast } from '../../../components/ui/toast/useToast.js';
import { useAuth } from '../../../features/auth/useAuth.js';
import { acceptInvite } from '../../../features/organisation/api/invites.js';
import { InviteHeading } from './InviteHeading.jsx';
import { InviteSummary } from './InviteSummary.jsx';
import { withArticle } from './inviteWords.js';

export function InviteJoin({ invite, token, onGone }) {
  const { addMembership } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const join = useMutation({
    mutationFn: () => acceptInvite(token),
    onSuccess: (membership) => {
      addMembership(membership);
      showToast({ type: 'success', title: `Welcome to ${membership.orgName}` });
      navigate(`/app/${membership.orgId}/schedule`, { replace: true });
    },
    // Withdrawn or expired since the page loaded: the page re-checks the
    // link and shows that it is no longer valid.
    onError: (err) => {
      if (err.status === 404) onGone();
    },
  });

  const role = withArticle(invite.role);

  return (
    <div>
      <InviteHeading icon={MailCheck} title={`Join ${invite.orgName}`}>
        {invite.inviterName || 'Someone'} has invited you to join as {role}. You are signed in as{' '}
        {invite.email}.
      </InviteHeading>

      <InviteSummary invite={invite} />

      {join.isError && join.error.status !== 404 && (
        <Callout variant="danger" className="mt-4">
          {join.error.message}
        </Callout>
      )}

      <Button size="lg" className="mt-5 w-full" isLoading={join.isPending} onClick={() => join.mutate()}>
        Join {invite.orgName} as {role}
      </Button>
    </div>
  );
}

// InviteMemberDialog - invites someone by email, with a role and the
// qualifications they hold.
//
// On success the dialog stays open to show the link: it may not have been
// emailed, and this is the only time the server ever sends it. It is also
// kept for this tab (inviteLinks.js), so Pending invites can copy it again.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { InviteMemberForm } from './InviteMemberForm.jsx';
import { InviteLinkResult } from './InviteLinkResult.jsx';
import { createInvite } from '../../features/organisation/api/invites.js';
import { rememberInviteLink } from '../../features/organisation/inviteLinks.js';
import { listQualifications } from '../../features/catalog/api/qualifications.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useAppConfig } from '../../features/config/useAppConfig.js';
import { useToast } from '../../components/ui/toast/useToast.js';

export function InviteMemberDialog({ onClose }) {
  const [invite, setInvite] = useState(null);

  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  // Asked while the form is filled in, so the result can say at once why no
  // email went out (InviteLinkResult.jsx).
  useAppConfig();

  const qualifications = useQuery({
    queryKey: ['qualifications', orgId],
    queryFn: () => listQualifications(orgId),
  });

  const mutation = useMutation({
    mutationFn: (data) => createInvite(orgId, data),
    onSuccess: (result) => {
      rememberInviteLink(result.inviteId, result.inviteLink);
      setInvite(result);
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] });
      showToast({ type: 'success', title: 'Invite created' });
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not invite', message: err.message }),
  });

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="border-b border-line-subtle px-5 py-4">
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            They will join once they open the link and sign in with this email.
          </DialogDescription>
        </div>

        {invite ? (
          <>
            <div className="px-5 py-4">
              <InviteLinkResult invite={invite} />
            </div>
            <div className="flex justify-end border-t border-line-subtle px-5 py-3">
              <Button onClick={onClose}>Done</Button>
            </div>
          </>
        ) : (
          <InviteMemberForm
            qualifications={qualifications.data ?? []}
            isSending={mutation.isPending}
            onSubmit={mutation.mutate}
            onCancel={onClose}
          />
        )}
      </DialogPanel>
    </Dialog>
  );
}

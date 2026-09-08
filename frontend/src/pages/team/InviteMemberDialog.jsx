// InviteMemberDialog - invites someone by email, with a role and the
// qualifications they hold.
//
// On success the dialog stays open to show the link, since it is not emailed
// and this is the only chance to copy it.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog/index.js';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { QualificationPicker } from './QualificationPicker.jsx';
import { InviteLinkResult } from './InviteLinkResult.jsx';
import { createInvite } from '../../features/organisation/api/members.js';
import { listQualifications } from '../../features/catalog/api/qualifications.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useToast } from '../../components/ui/toast/useToast.js';

export function InviteMemberDialog({ onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [qualificationIds, setQualificationIds] = useState([]);
  const [invite, setInvite] = useState(null);

  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const qualifications = useQuery({
    queryKey: ['qualifications', orgId],
    queryFn: () => listQualifications(orgId),
  });

  const mutation = useMutation({
    mutationFn: (data) => createInvite(orgId, data),
    onSuccess: (result) => {
      setInvite(result);
      queryClient.invalidateQueries({ queryKey: ['members', orgId] });
      showToast({ type: 'success', title: 'Invite created' });
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not invite', message: err.message }),
  });

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate({ email, role, qualificationIds });
  }

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="border-b border-line-subtle px-5 py-4">
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            They will join once they open the link and sign in with this email.
          </DialogDescription>
        </div>

        {invite ? (
          <div className="px-5 py-4">
            <InviteLinkResult invite={invite} />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-5 py-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nurse@example.com"
                autoFocus
                required
              />

              <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="manager">Manager</option>
              </Select>

              <QualificationPicker
                qualifications={qualifications.data ?? []}
                selected={qualificationIds}
                onChange={setQualificationIds}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
              <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" isLoading={mutation.isPending}>
                Create invite
              </Button>
            </div>
          </form>
        )}

        {invite && (
          <div className="flex justify-end border-t border-line-subtle px-5 py-3">
            <Button onClick={onClose}>Done</Button>
          </div>
        )}
      </DialogPanel>
    </Dialog>
  );
}

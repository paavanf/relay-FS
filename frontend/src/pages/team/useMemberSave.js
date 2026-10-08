// useMemberSave.js
// Saving the edit-member form: send the changes, refetch what they affect,
// and keep the auth context right when the person edited is you.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useAuth } from '../../features/auth/useAuth.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { updateMember } from '../../features/organisation/api/members.js';
import { refreshAfterTeamChange } from './teamQueries.js';

export function useMemberSave(member, onSaved) {
  const { orgId } = useOrg();
  const { user, updateMembership } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes) => updateMember(orgId, member.id, changes),
    onSuccess: (updated) => {
      // Editing yourself changes what this app should offer you, such as the
      // Team page itself after stepping down from manager.
      if (updated.userId === user.id) {
        updateMembership(orgId, { role: updated.role, qualificationIds: updated.qualificationIds });
      }
      refreshAfterTeamChange(queryClient, orgId);
      showToast({ type: 'success', title: `Saved changes to ${updated.name}` });
      onSaved();
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });
}

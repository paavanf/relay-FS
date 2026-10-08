// DeactivateMemberDialog - confirm taking someone off the team.
//
// It says exactly what happens, because one part is easy to miss: their
// shifts on draft rosters come off and show as unfilled. Nothing is deleted.
// Published rosters keep their shifts as history, and the account remains,
// so they can be invited back later.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '../../components/ui/dialog/index.js';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { deactivateMember } from '../../features/organisation/api/members.js';
import { refreshAfterTeamChange } from './teamQueries.js';

function removedMessage(count) {
  if (count === 0) return 'They had no shifts on draft rosters.';
  return `${count} draft ${count === 1 ? 'shift is' : 'shifts are'} now unfilled.`;
}

export function DeactivateMemberDialog({ member, onClose }) {
  const { orgId, orgName } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const deactivate = useMutation({
    mutationFn: () => deactivateMember(orgId, member.id),
    onSuccess: ({ removedDraftShifts }) => {
      refreshAfterTeamChange(queryClient, orgId);
      showToast({ type: 'success', title: `${member.name} deactivated`, message: removedMessage(removedDraftShifts) });
      onClose();
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not deactivate', message: err.message }),
  });

  return (
    <Dialog isOpen onClose={onClose}>
      <DialogPanel>
        <div className="px-5 py-4">
          <DialogTitle>Deactivate {member.name}?</DialogTitle>
          <DialogDescription>They lose access to {orgName} straight away.</DialogDescription>

          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-body-sm text-content-secondary">
            <li>Their shifts on draft rosters are removed and show as unfilled, ready to fill before you publish.</li>
            <li>Published rosters keep their shifts, so the history stays accurate.</li>
            <li>Fairness figures are recalculated without them.</li>
            <li>Their Relay account is not deleted. You can invite them back later.</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 border-t border-line-subtle px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={deactivate.isPending}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" isLoading={deactivate.isPending} onClick={() => deactivate.mutate()}>
            Deactivate
          </Button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

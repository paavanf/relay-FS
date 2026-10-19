// ApprovalCard - one swap everyone has accepted, waiting for a manager: the
// swap itself (sentences, diagram, time left), what approving would change,
// and Approve or Reject.
//
// Approving commits it there and then - every shift changes hands at once,
// or, if anything changed since it was proposed, none does and the reason
// is given. The outcome is told in a toast, since the swap leaves this list
// either way.
import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useChainAction } from '../../features/swaps/hooks/useChainActions.js';
import { ChainCard } from '../swaps/ChainCard.jsx';
import { ImpactPreview } from './ImpactPreview.jsx';
import { RejectDialog } from './RejectDialog.jsx';

export function ApprovalCard({ chain, onTimeUp }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const act = useChainAction(orgId);
  const [isRejecting, setIsRejecting] = useState(false);
  const names = chain.participants.map((person) => person.name).join(' and ');

  const decide = (action, body, success) =>
    act.mutate(
      { chainId: chain.id, action, body },
      {
        onSuccess: () => showToast({ type: 'success', title: success }),
        onError: (err) => showToast({ type: 'error', title: 'That did not go through', message: err.message }),
        onSettled: () => setIsRejecting(false),
      },
    );

  const actions = (
    <div className="space-y-4">
      <ImpactPreview chainId={chain.id} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="w-full sm:w-auto" isLoading={act.isPending && act.variables?.action === 'approve'} disabled={act.isPending} onClick={() => decide('approve', {}, 'Approved - the shifts have changed hands.')}>
          Approve swap
        </Button>
        <Button className="w-full sm:w-auto" variant="secondary" disabled={act.isPending} onClick={() => setIsRejecting(true)}>
          Reject
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ChainCard chain={chain} onTimeUp={onTimeUp} actions={actions} />
      {isRejecting && (
        <RejectDialog
          names={names}
          isRejecting={act.isPending}
          onReject={(reason) => decide('reject', reason ? { reason } : {}, 'Rejected. Everyone in it has been told.')}
          onClose={() => setIsRejecting(false)}
        />
      )}
    </>
  );
}

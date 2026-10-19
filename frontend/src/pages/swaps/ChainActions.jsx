// ChainActions - what the person looking can do with a proposed swap:
//
//   it is waiting for them   Accept or Decline - full width on a phone, where
//                            most people will answer
//   they proposed it         Cancel, while it has not happened yet
//
// Declining ends the swap for everyone at once, so it says so. Whatever the
// server answers, the lists are fetched again (useChainActions.js) - the
// swap may well move to another list - so the outcome is told in a toast,
// which stays put when this card does not.
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useChainAction } from '../../features/swaps/hooks/useChainActions.js';
import { isLive } from '../../features/swaps/chainSections.js';

function outcome(action, chain) {
  if (chain.status === 'committed') return 'The swap is done - the shifts have changed hands.';
  if (chain.status === 'awaiting_approval') return 'Everyone has accepted. A manager will approve it next.';
  return { accept: 'Accepted. Waiting for the others.', decline: 'Declined. The swap is off.', cancel: 'Proposal cancelled.' }[action];
}

export function ChainActions({ chain }) {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const act = useChainAction(orgId);
  const busy = (action) => act.isPending && act.variables?.action === action;
  const run = (action) =>
    act.mutate(
      { chainId: chain.id, action },
      {
        onSuccess: (after) => showToast({ type: 'success', title: outcome(action, after) }),
        onError: (err) => showToast({ type: 'error', title: 'That did not go through', message: err.message }),
      },
    );

  return (
    <div className="space-y-2">
      {chain.waitingForYou && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" isLoading={busy('accept')} disabled={act.isPending} onClick={() => run('accept')}>
              Accept
            </Button>
            <Button className="w-full sm:w-auto" variant="secondary" isLoading={busy('decline')} disabled={act.isPending} onClick={() => run('decline')}>
              Decline
            </Button>
          </div>
          <p className="text-body-sm text-content-tertiary">Declining calls the whole swap off, for everyone in it.</p>
        </>
      )}
      {chain.youProposed && isLive(chain) && (
        <Button variant="ghost" size="sm" isLoading={busy('cancel')} disabled={act.isPending} onClick={() => run('cancel')}>
          Cancel this proposal
        </Button>
      )}
    </div>
  );
}

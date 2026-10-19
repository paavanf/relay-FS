// SwapProposals - the proposed swaps someone is in, sorted into the Swaps
// page's lists (features/swaps/chainSections.js):
//
//   Waiting for you   at the top, because these have a deadline on them
//   Your proposals    swaps they proposed or accepted, still going
//   History           what ended, and how - rendered lower on the page
//
// The chains are fetched every 15 seconds while the page is open; when a
// deadline passes, they are fetched straight away rather than assumed.
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useSwapChains } from '../../features/swaps/hooks/useSwapChains.js';
import { chainSections } from '../../features/swaps/chainSections.js';
import { ChainList } from './ChainList.jsx';

export function SwapProposals({ highlightId }) {
  const { orgId } = useOrg();
  const chains = useSwapChains(orgId);

  if (chains.isPending) return <Skeleton className="h-32 w-full" />;
  if (chains.error) return <ErrorState message={chains.error.message} onRetry={chains.refetch} />;

  const { waiting, proposals } = chainSections(chains.data);
  return (
    <div className="space-y-6">
      <ChainList
        title="Waiting for you"
        chains={waiting}
        empty="Nobody is waiting for you to answer a swap."
        onTimeUp={chains.refetch}
        highlightId={highlightId}
      />
      <ChainList
        title="Your proposals"
        description="Swaps you proposed or accepted, waiting for the others - or a manager."
        chains={proposals}
        onTimeUp={chains.refetch}
        highlightId={highlightId}
      />
    </div>
  );
}

export function SwapHistory({ highlightId }) {
  const { orgId } = useOrg();
  const chains = useSwapChains(orgId);
  if (!chains.data) return null;

  const { history } = chainSections(chains.data);
  return <ChainList title="History" description="Swaps that have ended, and how." chains={history} highlightId={highlightId} />;
}

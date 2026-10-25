// SwapApprovalsPage - the manager's queue: every swap the people in it have
// all accepted, soonest deadline first, each with what approving it would
// change and Approve or Reject. Managers and owners only; the route already
// enforces that, and so does the server.
//
// Fetched every 15 seconds while open, like the Swaps page, so a swap that
// expires or is called off while a manager is looking drops out on its own.
// A notification links here with ?chain=<id>, and that swap is outlined.
import { useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useSwapChains } from '../../features/swaps/hooks/useSwapChains.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { ApprovalCard } from './ApprovalCard.jsx';

const soonestFirst = (a, b) => new Date(a.expiresAt) - new Date(b.expiresAt);

function SwapApprovalsPage() {
  const { orgId } = useOrg();
  useDocumentTitle('Swap approvals');
  const chains = useSwapChains(orgId);
  const [params] = useSearchParams();
  const waiting = (chains.data ?? []).filter((chain) => chain.status === 'awaiting_approval').sort(soonestFirst);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Swap approvals" description="Swaps everyone in them has accepted, waiting for a manager to approve or reject." />

      <div className="mt-6">
        {chains.isPending && <Skeleton className="h-48 w-full" />}
        {chains.error && <ErrorState message={chains.error.message} onRetry={chains.refetch} />}
        {chains.data && waiting.length === 0 && (
          <Card>
            <EmptyState illustration="swap" title="Nothing to approve" description="When everyone in a swap has accepted it, it waits for you here." />
          </Card>
        )}
        {waiting.length > 0 && (
          <ul className="space-y-4" aria-label="Swaps waiting for approval">
            {waiting.map((chain) => (
              <ApprovalCard key={chain.id} chain={chain} onTimeUp={chains.refetch} highlight={chain.id === params.get('chain')} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SwapApprovalsPage;

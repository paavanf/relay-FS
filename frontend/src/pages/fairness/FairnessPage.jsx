// FairnessPage - who has been carrying the nights, evenings and weekends.
//
// Managers and owners see the whole team; everyone else sees only themselves
// against the team average. That split is made by the server: this page just
// renders whichever view it was sent, so it cannot leak what it never had.
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { getFairness } from '../../features/fairness/api/fairness.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { WorkerFairness } from './WorkerFairness.jsx';
import { ManagerFairness } from './ManagerFairness.jsx';
import { FairnessEmptyState } from './FairnessEmptyState.jsx';
import { HowItsCalculated } from './HowItsCalculated.jsx';
import { RecomputeButton } from './RecomputeButton.jsx';
import { formatWindow } from './fairnessWords.js';

function FairnessPage() {
  const { orgId, isManager } = useOrg();
  useDocumentTitle('Fairness');

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['fairness', orgId],
    queryFn: () => getFairness(orgId),
  });

  const measuredSince = data?.window ? `Published rosters, ${formatWindow(data.window)}.` : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Fairness"
        description={measuredSince ?? 'How the nights, evenings and weekends are shared out.'}
        actions={data?.view === 'team' && data.window ? <RecomputeButton /> : null}
      />

      {isPending && <Skeleton className="h-64 w-full" />}
      {error && <ErrorState message={error.message} onRetry={refetch} />}

      {data && !data.window && <FairnessEmptyState isManager={isManager} windowDays={data.policy.windowDays} />}
      {data?.window && data.view === 'team' && <ManagerFairness data={data} />}
      {data?.window && data.view === 'self' && <WorkerFairness data={data} />}

      {data && <HowItsCalculated policy={data.policy} />}
    </div>
  );
}

export default FairnessPage;

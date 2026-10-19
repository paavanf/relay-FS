// ImpactPreview - what approving a swap would change, worked out by the
// server: coverage role by role (unchanged, and confirmed), each person's
// fairness figures before and after, and the rule check on their weeks.
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useChainImpact } from '../../features/swaps/hooks/useSwapChains.js';
import { CoverageImpact } from './CoverageImpact.jsx';
import { FairnessImpact } from './FairnessImpact.jsx';
import { RuleCheck } from './RuleCheck.jsx';

export function ImpactPreview({ chainId }) {
  const { orgId } = useOrg();
  const impact = useChainImpact(orgId, chainId);

  if (impact.isPending) return <Skeleton className="h-28 w-full" />;
  if (impact.error) return <Callout variant="warning">{impact.error.message}</Callout>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <CoverageImpact coverage={impact.data.coverage} />
      <FairnessImpact fairness={impact.data.fairness} />
      <RuleCheck rules={impact.data.rules} />
    </div>
  );
}

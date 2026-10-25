// ScheduleSummary - the roster's state at a glance, above the grid: days
// covered (a bar per day in its coverage colour), shifts rostered, shifts
// unfilled, and swaps waiting. Built only from what the page already has,
// plus the swap summary the sidebar already asks for - the same cached
// query, so it costs no extra request.
import { SummaryTile } from '../../components/ui/SummaryTile.jsx';
import { CoverageStrip } from './CoverageStrip.jsx';
import { summariseRoster } from './scheduleSummary.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useChainSummary } from '../../features/swaps/hooks/useSwapChains.js';

export function ScheduleSummary({ detail, roles }) {
  const { orgId, isManager } = useOrg();
  const swaps = useChainSummary(orgId).data;
  const summary = summariseRoster({ ...detail, roles });
  const waiting = isManager ? swaps?.awaitingApproval : swaps?.waitingForYou;
  const allCovered = summary.covered === summary.days.length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryTile
        label="Days covered"
        value={summary.covered}
        suffix={`of ${summary.days.length}`}
        tone={allCovered ? 'success' : summary.anyShort ? 'danger' : 'warning'}
      >
        <CoverageStrip days={summary.days} />
      </SummaryTile>

      <SummaryTile
        label="Shifts rostered"
        value={summary.shifts}
        detail={`for ${summary.people} ${summary.people === 1 ? 'person' : 'people'}`}
      />

      <SummaryTile
        label="Unfilled"
        value={summary.unfilled}
        tone={summary.unfilled > 0 ? 'danger' : 'success'}
        detail={summary.unfilled > 0 ? 'listed below, with the reason' : 'every shift is covered'}
      />

      <SummaryTile
        label="Swaps waiting"
        value={waiting ?? '-'}
        tone={waiting > 0 ? 'warning' : 'neutral'}
        detail={isManager ? 'for your approval' : 'for your answer'}
      />
    </div>
  );
}

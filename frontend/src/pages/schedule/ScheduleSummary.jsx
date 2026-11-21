// ScheduleSummary - the roster's state at a glance, above the grid: days
// covered (a bar per day in its coverage colour), shifts rostered, shifts
// unfilled, and swaps waiting. Built only from what the page already has,
// plus the swap summary the sidebar already asks for - the same cached
// query, so it costs no extra request. A roster with no shifts, or nothing to
// cover, never claims to be covered (scheduleSummary.js says what instead).
import { SummaryTile } from '../../components/ui/SummaryTile.jsx';
import { CoverageStrip } from './CoverageStrip.jsx';
import { summariseRoster, unfilledTile } from './scheduleSummary.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useChainSummary } from '../../features/swaps/hooks/useSwapChains.js';

export function ScheduleSummary({ detail, roles }) {
  const { orgId, isManager } = useOrg();
  const swaps = useChainSummary(orgId).data;
  const summary = summariseRoster({ ...detail, roles });
  const waiting = isManager ? swaps?.awaitingApproval : swaps?.waitingForYou;
  const unfilled = unfilledTile(summary, { canGenerate: isManager && detail.roster.status === 'draft' });
  const allCovered = summary.covered === summary.ruled;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryTile
        label="Days covered"
        value={summary.ruled > 0 ? summary.covered : '-'}
        suffix={summary.ruled > 0 ? `of ${summary.ruled}` : undefined}
        tone={summary.ruled === 0 ? 'neutral' : allCovered ? 'success' : summary.anyShort ? 'danger' : 'warning'}
      >
        <CoverageStrip days={summary.days} />
      </SummaryTile>

      <SummaryTile
        label="Shifts rostered"
        value={summary.shifts}
        detail={`for ${summary.people} ${summary.people === 1 ? 'person' : 'people'}`}
      />

      <SummaryTile label="Unfilled" value={unfilled.value} tone={unfilled.tone} detail={unfilled.detail} />

      <SummaryTile
        label="Swaps waiting"
        value={waiting ?? '-'}
        tone={waiting > 0 ? 'warning' : 'neutral'}
        detail={isManager ? 'for your approval' : 'for your answer'}
      />
    </div>
  );
}

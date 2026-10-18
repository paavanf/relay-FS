// MyShiftsPage - the page most people actually open.
//
// Only their own shifts, only from published rosters, only from today
// onwards - the server enforces all three, so a worker cannot widen it by
// editing the query string.
//
// Built narrow first: this gets read on a phone, one-handed, in a corridor.
// Each shift still to come can be offered for a swap from here.
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { ShiftList } from './ShiftList.jsx';
import { NoShiftsState } from './NoShiftsState.jsx';
import { listAssignments } from '../../features/roster/api/assignments.js';
import { listShiftTemplates } from '../../features/catalog/api/shiftTemplates.js';
import { indexTemplates } from '../schedule/grid/dates.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useMyOffersByShift } from '../../features/swaps/hooks/useSwapRequests.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

// Eight weeks ahead is enough to plan around without loading a year.
const WEEKS_AHEAD = 8;

function MyShiftsPage() {
  const { orgId, orgTimezone } = useOrg();
  useDocumentTitle('My shifts');

  const from = DateTime.utc().toISODate();
  const to = DateTime.utc().plus({ weeks: WEEKS_AHEAD }).toISODate();

  const shifts = useQuery({
    queryKey: ['myShifts', orgId, from, to],
    queryFn: () => listAssignments(orgId, { from, to }),
  });

  const templates = useQuery({
    queryKey: ['shiftTemplates', orgId],
    queryFn: () => listShiftTemplates(orgId),
  });

  const offers = useMyOffersByShift(orgId);

  const isPending = shifts.isPending || templates.isPending;
  const error = shifts.error ?? templates.error;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My shifts" description="Everything you are scheduled for, week by week." />

      <div className="mt-6">
        {isPending && <Skeleton className="h-64 w-full" />}
        {error && <ErrorState message={error.message} onRetry={shifts.refetch} />}
        {offers.error && (
          <Callout variant="warning" className="mb-4">
            Your swap offers could not be loaded, so shifts cannot be offered just now.
          </Callout>
        )}

        {!isPending &&
          !error &&
          (shifts.data.length === 0 ? (
            <NoShiftsState />
          ) : (
            <ShiftList
              assignments={shifts.data}
              templatesById={indexTemplates(templates.data)}
              timezone={orgTimezone}
              offersByAssignment={offers.byShift}
            />
          ))}
      </div>
    </div>
  );
}

export default MyShiftsPage;

// AvailabilityPage - declare which days you can and cannot work.
//
// Only recurring weekly status for now; one-off dates and per-shift rules
// come later. Available days are stored as the absence of an entry.
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { AvailabilityEditor } from './AvailabilityEditor.jsx';
import { SchedulingRulesCard } from './SchedulingRulesCard.jsx';
import { getMyAvailability } from '../../features/availability/api/availability.js';
import { toStatusByDay } from '../../features/availability/toStatusByDay.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function AvailabilityPage() {
  const { orgId } = useOrg();
  const [statusByDay, setStatusByDay] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  useDocumentTitle('Availability');

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['availability', orgId],
    queryFn: () => getMyAvailability(orgId),
  });

  // Seed the form once the saved set arrives, and again after a save.
  useEffect(() => {
    if (data) {
      setStatusByDay(toStatusByDay(data));
      setIsDirty(false);
    }
  }, [data]);

  function handleChange(dayOfWeek, status) {
    setStatusByDay((current) => ({ ...current, [dayOfWeek]: status }));
    setIsDirty(true);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Availability"
        description="Tell Relay when you can work, so the roster respects it."
      />

      {/* Above the editor on purpose: the limits should be read before the
          declarations are made, not after. Rendered outside the availability
          loading branch so the context is there even if availability itself
          fails to load. */}
      <div className="mt-6">
        <SchedulingRulesCard />
      </div>

      {isPending && <Skeleton className="mt-4 h-64 w-full" />}
      {isError && <ErrorState className="mt-4" message={error.message} onRetry={refetch} />}

      {data && (
        <div className="mt-4">
          <AvailabilityEditor
            statusByDay={statusByDay}
            isDirty={isDirty}
            onChange={handleChange}
            onSaved={() => setIsDirty(false)}
          />
        </div>
      )}
    </div>
  );
}

export default AvailabilityPage;

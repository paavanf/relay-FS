// AvailabilityPage - declare which days you can and cannot work.
//
// Only recurring weekly status for now; one-off dates and per-shift rules
// come later. Available days are stored as the absence of an entry.
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { RecurringAvailability } from './RecurringAvailability.jsx';
import { AvailabilityLegend } from './AvailabilityLegend.jsx';
import { SaveAvailabilityBar } from './SaveAvailabilityBar.jsx';
import { getMyAvailability } from '../../features/availability/api/availability.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

// Saved entries -> a status per weekday, for the selects to read.
function toStatusByDay(entries) {
  const byDay = {};
  for (const entry of entries) {
    if (entry.type === 'recurring' && entry.dayOfWeek !== null) {
      byDay[entry.dayOfWeek] = entry.status;
    }
  }
  return byDay;
}

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

      {isPending && <Skeleton className="mt-6 h-64 w-full" />}
      {isError && <ErrorState className="mt-6" message={error.message} onRetry={refetch} />}

      {data && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Every week</CardTitle>
            </CardHeader>
            <CardContent>
              <RecurringAvailability statusByDay={statusByDay} onChange={handleChange} />
            </CardContent>
          </Card>

          <SaveAvailabilityBar
            statusByDay={statusByDay}
            isDirty={isDirty}
            onSaved={() => setIsDirty(false)}
          />

          <Card>
            <CardHeader>
              <CardTitle>What these mean</CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityLegend />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AvailabilityPage;

// SchedulingRulesCard - the limits your roster is built within.
//
// Read-only for everyone, managers included: this page is not where rules are
// changed, and an editable field here would only invite someone to try.
//
// It sits on Availability because that is where the numbers are actually
// useful. Someone deciding which days to mark unavailable needs to know the
// rest gap and the weekly cap to make a sensible choice - it is context for
// the task, not a settings lookup.
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { getRosterRules } from '../../features/organisation/api/rosterRules.js';
import { RuleSentenceList } from './RuleSentenceList.jsx';
import { useOrg } from '../../features/organisation/useOrg.js';

export function SchedulingRulesCard() {
  const { orgId } = useOrg();

  const { data, isPending, isError } = useQuery({
    queryKey: ['rosterRules', orgId],
    queryFn: () => getRosterRules(orgId),
  });

  if (isPending) return <Skeleton className="h-32 w-full" />;

  // Deliberately quiet. This is supporting context, and a red alert for
  // failing to load it would be louder than the page's actual purpose.
  if (isError) {
    return (
      <p className="text-body-sm text-content-tertiary">
        Scheduling limits could not be loaded.
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-body-sm text-content-secondary">
          Your organisation schedules within these limits. They are enforced
          automatically - a shift is left unfilled rather than break one.
        </p>

        <RuleSentenceList rules={data} className="mt-3 space-y-1.5" />
      </CardContent>
    </Card>
  );
}

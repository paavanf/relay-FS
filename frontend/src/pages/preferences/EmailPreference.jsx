// EmailPreference - "Email me about swaps and rosters", on unless turned off.
// It covers the things that expire or change your week - a swap proposed to
// you, one waiting for your approval, a newly published roster. Everything
// else stays in the app, under the bell. PreferencesPage shows it only on a
// deployment that sends email.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { getPreferences, savePreferences } from '../../features/notifications/api/notifications.js';

export function EmailPreference() {
  const { orgId } = useOrg();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const key = ['preferences', orgId];

  const preferences = useQuery({ queryKey: key, queryFn: () => getPreferences(orgId) });
  const save = useMutation({
    mutationFn: (emailNotifications) => savePreferences(orgId, { emailNotifications }),
    onSuccess: (saved) => {
      queryClient.setQueryData(key, saved);
      showToast({ type: 'success', title: 'Preferences saved' });
    },
    onError: (err) => showToast({ type: 'error', title: 'Could not save', message: err.message }),
  });

  if (preferences.isPending) return <Skeleton className="h-24 w-full" />;
  if (preferences.error) return <ErrorState message={preferences.error.message} onRetry={preferences.refetch} />;

  return (
    <Card>
      <CardContent className="space-y-2">
        <Checkbox
          label="Email me about swaps and rosters"
          checked={preferences.data.emailNotifications}
          disabled={save.isPending}
          onChange={(event) => save.mutate(event.target.checked)}
        />
        <p className="text-body-sm text-content-secondary">
          A swap proposed to you, a swap waiting for your approval, and a newly published roster. Everything else stays in Relay, under the
          bell.
        </p>
      </CardContent>
    </Card>
  );
}

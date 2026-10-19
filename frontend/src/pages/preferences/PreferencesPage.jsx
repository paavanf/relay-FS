// PreferencesPage - your details, and how this organisation reaches you:
// one setting, "Email me about swaps and rosters", on unless turned off. It
// covers the things that expire or change your week - a swap proposed to
// you, one waiting for your approval, a newly published roster. Everything
// else stays in the app, under the bell. Reached from the user menu.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { useToast } from '../../components/ui/toast/useToast.js';
import { useAuth } from '../../features/auth/useAuth.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { getPreferences, savePreferences } from '../../features/notifications/api/notifications.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function PreferencesPage() {
  const { user } = useAuth();
  const { orgId, orgName } = useOrg();
  useDocumentTitle('Preferences');
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

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Preferences" description={`Your details, and how ${orgName} reaches you.`} />

      <div className="mt-6 space-y-4">
        <Card>
          <CardContent>
            <dl className="grid gap-3 text-body-sm sm:grid-cols-2">
              <div>
                <dt className="text-label text-content-secondary">Name</dt>
                <dd className="text-content-primary">{user?.name}</dd>
              </div>
              <div>
                <dt className="text-label text-content-secondary">Email</dt>
                <dd className="break-words text-content-primary">{user?.email}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {preferences.isPending && <Skeleton className="h-24 w-full" />}
        {preferences.error && <ErrorState message={preferences.error.message} onRetry={preferences.refetch} />}
        {preferences.data && (
          <Card>
            <CardContent className="space-y-2">
              <Checkbox
                label="Email me about swaps and rosters"
                checked={preferences.data.emailNotifications}
                disabled={save.isPending}
                onChange={(event) => save.mutate(event.target.checked)}
              />
              <p className="text-body-sm text-content-secondary">
                A swap proposed to you, a swap waiting for your approval, and a newly published roster. Everything else stays in Relay, under
                the bell.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default PreferencesPage;

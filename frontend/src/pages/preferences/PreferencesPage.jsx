// PreferencesPage - your details, and how this organisation reaches you.
// Reached from the user menu. Where the deployment sends email it offers
// one setting, "Email me about swaps and rosters" (EmailPreference.jsx);
// where it does not (useAppConfig), the toggle is hidden and the page says
// that everything reaches you in the app instead.
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Card, CardContent } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { useOrg } from '../../features/organisation/useOrg.js';
import { useAppConfig } from '../../features/config/useAppConfig.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { EmailPreference } from './EmailPreference.jsx';

function PreferencesPage() {
  const { user } = useAuth();
  const { orgName } = useOrg();
  const config = useAppConfig();
  useDocumentTitle('Preferences');

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

        {config.isPending && <Skeleton className="h-24 w-full" />}
        {config.data?.emailEnabled === false && (
          <p className="text-body-sm text-content-secondary">
            This deployment doesn&apos;t send email, so everything reaches you in Relay itself, under the bell.
          </p>
        )}
        {(config.data?.emailEnabled === true || config.isError) && <EmailPreference />}
      </div>
    </div>
  );
}

export default PreferencesPage;

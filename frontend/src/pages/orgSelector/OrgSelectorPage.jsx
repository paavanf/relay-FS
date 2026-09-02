// OrgSelectorPage - the first screen after logging in. Pick an organisation.
import { useAuth } from '../../features/auth/useAuth.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Logo } from '../../components/Logo.jsx';
import { OrgList } from './OrgList.jsx';
import { EmptyOrgState } from './EmptyOrgState.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function OrgSelectorPage() {
  const { memberships } = useAuth();
  useDocumentTitle('Choose an organisation');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Logo size="md" />
      </div>

      <PageHeader
        title="Choose an organisation"
        description="You can switch between these at any time from the top bar."
        className="mb-6"
      />

      {memberships.length === 0 ? <EmptyOrgState /> : <OrgList memberships={memberships} />}
    </div>
  );
}

export default OrgSelectorPage;

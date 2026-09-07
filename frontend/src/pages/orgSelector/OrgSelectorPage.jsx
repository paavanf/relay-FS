// OrgSelectorPage - the first screen after signing in. Pick an organisation,
// or create one.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { OrgSelectorHeader } from './OrgSelectorHeader.jsx';
import { OrgList } from './OrgList.jsx';
import { EmptyOrgState } from './EmptyOrgState.jsx';
import CreateOrgDialog from './CreateOrgDialog/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function OrgSelectorPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { memberships } = useAuth();

  useDocumentTitle('Choose an organisation');

  const hasOrgs = memberships.length > 0;

  return (
    <div className="min-h-full bg-surface-page">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <OrgSelectorHeader />

        <PageHeader
          title="Choose an organisation"
          description="You can switch between these at any time from the top bar."
          className="mt-8 mb-6"
          actions={
            // The empty state has its own, more prominent button.
            hasOrgs ? (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="size-4" />
                Create organisation
              </Button>
            ) : null
          }
        />

        {hasOrgs ? (
          <OrgList memberships={memberships} />
        ) : (
          <EmptyOrgState onCreateClick={() => setIsDialogOpen(true)} />
        )}
      </div>

      <CreateOrgDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}

export default OrgSelectorPage;

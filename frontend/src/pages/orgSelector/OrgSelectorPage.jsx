// OrgSelectorPage - the first screen after logging in. Pick an organisation,
// or create one.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { AuroraBackground } from '../../components/AuroraBackground.jsx';
import { Reveal } from '../../components/motion/Reveal.jsx';
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
    <div className="relative min-h-full overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16">
        <Reveal delay={0} className="mb-12">
          <OrgSelectorHeader />
        </Reveal>

        <Reveal delay={90}>
          <PageHeader
            title="Choose an organisation"
            description="You can switch between these at any time from the top bar."
            className="mb-10"
            actions={
              // Only shown when they already have orgs - the empty state has
              // its own, more prominent button.
              hasOrgs ? (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="size-4" />
                  Create organisation
                </Button>
              ) : null
            }
          />
        </Reveal>

        {hasOrgs ? (
          <OrgList memberships={memberships} />
        ) : (
          <Reveal delay={200}>
            <EmptyOrgState onCreateClick={() => setIsDialogOpen(true)} />
          </Reveal>
        )}
      </div>

      <CreateOrgDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}

export default OrgSelectorPage;

// OrgSelectorPage - the first screen after logging in. Pick an organisation.
import { useAuth } from '../../features/auth/useAuth.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Logo } from '../../components/Logo.jsx';
import { AuroraBackground } from '../../components/AuroraBackground.jsx';
import { Reveal } from '../../components/motion/Reveal.jsx';
import { OrgList } from './OrgList.jsx';
import { EmptyOrgState } from './EmptyOrgState.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function OrgSelectorPage() {
  const { memberships } = useAuth();
  useDocumentTitle('Choose an organisation');

  return (
    <div className="relative min-h-full overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16">
        <Reveal delay={0} className="mb-12">
          <Logo size="md" />
        </Reveal>

        <Reveal delay={90}>
          <PageHeader
            title="Choose an organisation"
            description="You can switch between these at any time from the top bar."
            className="mb-10"
          />
        </Reveal>

        {memberships.length === 0 ? (
          <Reveal delay={200}>
            <EmptyOrgState />
          </Reveal>
        ) : (
          <OrgList memberships={memberships} />
        )}
      </div>
    </div>
  );
}

export default OrgSelectorPage;

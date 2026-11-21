// PrivacyPage - /privacy: what Relay keeps about the people who use it,
// where, who can see it, and how to have it deleted. Public, signed in or
// not: Google's consent screen links to it.
//
// Every statement is about this codebase, and each section's file says
// where in the code its words come from - so a change there means a change
// here, and a new date in policyFacts.js. It wears the landing page's top
// bar and footer, so it reads as part of the same public site.
import { LandingNav } from '../landing/nav/index.js';
import { LandingFooter } from '../landing/footer/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { PolicySection } from './PolicySection.jsx';
import { LAST_UPDATED } from './policyFacts.js';
import { WhoRunsRelay } from './sections/WhoRunsRelay.jsx';
import { WhatRelayCollects } from './sections/WhatRelayCollects.jsx';
import { WhereItIsStored } from './sections/WhereItIsStored.jsx';
import { InYourBrowser } from './sections/InYourBrowser.jsx';
import { WhatRelayDoesNotDo } from './sections/WhatRelayDoesNotDo.jsx';
import { SigningInWithGoogle } from './sections/SigningInWithGoogle.jsx';
import { SharedDemo } from './sections/SharedDemo.jsx';
import { DeletingYourData } from './sections/DeletingYourData.jsx';

function PrivacyPage() {
  useDocumentTitle('Privacy policy');

  return (
    <div className="min-h-full bg-surface-base">
      <LandingNav />

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-h1 text-content-primary">Privacy policy</h1>
        <p className="mt-3 text-sm leading-relaxed text-content-secondary">
          What Relay keeps about you, where it keeps it, who can see it, and how to have it deleted.
        </p>

        <div className="mt-10 space-y-10">
          <WhoRunsRelay />
          <WhatRelayCollects />
          <WhereItIsStored />
          <InYourBrowser />
          <WhatRelayDoesNotDo />
          <SigningInWithGoogle />
          <SharedDemo />
          <DeletingYourData />
          <PolicySection id="last-updated" title="9. Last updated">
            <p>{LAST_UPDATED}</p>
          </PolicySection>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

export default PrivacyPage;

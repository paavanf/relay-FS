// LandingPage - what a logged-out visitor sees at "/".
//
// Product first: the real roster grid, the real unfilled-shift reasons and a
// real rule check, all rendered from engine output in ./fixtures. It makes no
// network requests. Logged-in visitors never reach it - RootRedirect sends
// them into the app.
//
// The nav and the hero sit on a full-width band in the rail's deep tone (the
// same structure as the signed-in app), with the sample roster raised over
// the band's edge; the sections below sit on the page.
import { LandingNav } from './nav/index.js';
import { Hero } from './hero/index.js';
import { UnfilledStory } from './gaps/index.js';
import { EditCheckSection } from './edits/index.js';
import { HowItWorks } from './workflow/index.js';
import { GetStarted } from './cta/index.js';
import { LandingFooter } from './footer/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

function LandingPage() {
  useDocumentTitle('Rosters that follow your rules');

  return (
    <div className="min-h-full bg-surface-base">
      <LandingNav />

      <main>
        <Hero />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <UnfilledStory />
          <EditCheckSection />
          <HowItWorks />
          <GetStarted />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingPage;

// LandingPage - what a logged-out visitor sees at "/".
//
// Product first: the real roster grid, the real unfilled-shift reasons and a
// real rule check, all rendered from engine output in ./fixtures. It makes no
// network requests. Logged-in visitors never reach it - RootRedirect sends
// them into the app.
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Hero />
        <UnfilledStory />
        <EditCheckSection />
        <HowItWorks />
        <GetStarted />
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingPage;

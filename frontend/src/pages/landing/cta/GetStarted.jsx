// GetStarted - the closing call to action, and the honest line about what is
// built and what is not.
//
// Fairness shipped in Milestone 6 and is described by exactly what it does.
// So are swaps, now that Milestone 8 completes them: Relay finds the
// options, everyone in one accepts, a manager approves where the rules ask
// for it, and every shift changes hands at once - nothing more is claimed.
// And notifications (Milestone 9): the bell, and email for exactly the three
// events that send one - no push, no texts, nothing instant.
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';
import { DEMO_MODE } from '../../../features/demo/demoMode.js';
import { LandingSection } from '../LandingSection.jsx';

export function GetStarted() {
  return (
    <LandingSection
      id="start"
      title="Set up your first roster"
      intro="Create an organisation, add your shifts and invite your team. Then generate a week and see what it can fill."
    >
      <div className="flex flex-wrap gap-3">
        <ButtonLink to="/register" size="lg">
          Create an organisation
        </ButtonLink>
        {/* The public demo build offers the shared demo, on the login page, instead. */}
        <ButtonLink to="/login" size="lg" variant="secondary">
          {DEMO_MODE ? 'Try the demo' : 'Log in'}
        </ButtonLink>
      </div>

      <div className="mt-12 max-w-2xl space-y-2 border-t border-line-subtle pt-4 text-body-sm text-content-tertiary">
        <p>
          <span className="font-medium text-content-secondary">Fairness:</span> everyone can see how their share of
          the nights, evenings and weekends over the last 12 weeks compares with the team average, and the
          generator steers the heaviest shifts away from anyone above it.
        </p>
        <p>
          <span className="font-medium text-content-secondary">Swaps:</span> offer a shift you cannot work and
          Relay finds who could take it - a direct swap, or a chain of three or four people where each takes the
          next one's shift. Once everyone in it accepts, and a manager approves if you ask for that, Relay checks
          it against the same rules as any roster edit and every shift changes hands at once.
        </p>
        <p>
          <span className="font-medium text-content-secondary">Notifications:</span> the bell in the app tells you
          when a roster with your shifts is published, when a swap is waiting for your answer - or, for managers,
          your approval - and when a swap you are in goes through. The roster and the swaps waiting for you are
          emailed too, unless you turn that off in Preferences.
        </p>
      </div>
    </LandingSection>
  );
}

// GetStarted - the closing invitation, on a panel in the rail's deep tone
// that answers the hero band, then three short notes on what else Relay does.
// Every note describes something the app really does, and says so carefully:
// email goes out only where the server has email set up.
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';
import { DEMO_MODE } from '../../../features/demo/demoMode.js';

export function GetStarted() {
  return (
    <section id="start" aria-labelledby="start-title" className="border-t border-line-subtle py-16 sm:py-20">
      <div data-surface="rail" className="rounded-xl bg-surface-raised px-6 py-10 elevation-md sm:px-10">
        <h2 id="start-title" className="text-h1 font-stretch-semi-expanded text-content-primary">
          Set up your first roster
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-content-secondary">
          Create an organisation, add your shifts and invite your team. Then generate a week and see what it can fill.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink to="/register" size="lg">
            Create an organisation
          </ButtonLink>
          {/* The public demo build offers the shared demo, on the login page, instead. */}
          <ButtonLink to="/login" size="lg" variant="secondary">
            {DEMO_MODE ? 'Try the demo' : 'Log in'}
          </ButtonLink>
        </div>
      </div>

      <div className="mt-10 max-w-2xl space-y-2 text-body-sm text-content-tertiary">
        <p>
          <span className="font-medium text-content-secondary">Fairness:</span> everyone can see how their share of
          the nights, evenings and weekends over the last 12 weeks compares with the team average, and the
          generator steers the heaviest shifts away from anyone above it.
        </p>
        <p>
          <span className="font-medium text-content-secondary">Swaps:</span> offer a shift you cannot work and
          Relay finds who could take it - a direct swap, or a chain of three or four people where each takes the
          next one&apos;s shift. Once everyone in it accepts, and a manager approves if you ask for that, Relay checks
          it against the same rules as any roster edit and every shift changes hands at once.
        </p>
        <p>
          <span className="font-medium text-content-secondary">Notifications:</span> the bell in the app tells you
          when a roster with your shifts is published, when a swap is waiting for your answer - or, for managers,
          your approval - and when a swap you are in goes through. Where email is set up, the roster and the swaps
          waiting for you are emailed too, unless you turn that off in Preferences.
        </p>
      </div>
    </section>
  );
}

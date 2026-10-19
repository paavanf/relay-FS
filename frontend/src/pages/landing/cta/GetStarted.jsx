// GetStarted - the closing call to action, and the honest line about what is
// built and what is not.
//
// Fairness shipped in Milestone 6 and is described by exactly what it does.
// So are swaps, now that Milestone 8 completes them: Relay finds the
// options, everyone in one accepts, a manager approves where the rules ask
// for it, and every shift changes hands at once - nothing more is claimed.
import { ButtonLink } from '../../../components/ui/ButtonLink.jsx';
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
        <ButtonLink to="/login" size="lg" variant="secondary">
          Log in
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
      </div>
    </LandingSection>
  );
}

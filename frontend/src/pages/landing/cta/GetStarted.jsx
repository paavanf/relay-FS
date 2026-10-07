// GetStarted - the closing call to action, and the one honest line about
// what is not built yet.
//
// Swaps and the fairness ledger are named here, clearly labelled, and
// nowhere else on the page: they are planned, not shipped.
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

      <p className="mt-12 max-w-2xl border-t border-line-subtle pt-4 text-body-sm text-content-tertiary">
        <span className="font-medium text-content-secondary">In development:</span> shift swaps,
        and a fairness ledger that tracks who has worked the nights and weekends over time.
      </p>
    </LandingSection>
  );
}

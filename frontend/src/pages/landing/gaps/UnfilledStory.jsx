// UnfilledStory - what Relay does when there are not enough people.
//
// The product's defining behaviour: it would rather leave a shift empty than
// break a rule to fill it, and it says why. Told with two runs of the
// evaluation harness and the real UnfilledSlotsPanel holding every reason
// the engine gave - all 24, not a flattering selection.
import { LandingSection } from '../LandingSection.jsx';
import { ReasonsList } from './ReasonsList.jsx';
import { ScenarioFigures } from './ScenarioFigures.jsx';
import { describeBlockingRules } from './blockingRules.js';
import { ward, understaffed } from '../fixtures/index.js';

export function UnfilledStory() {
  const full = ward.totals;
  const short = understaffed.totals;
  const fullResult = full.filled === full.shifts ? 'filled every one' : `filled ${full.filled}`;

  return (
    <LandingSection
      id="gaps"
      title="When it can't fill a shift, it tells you why"
      intro={`We asked Relay to staff a ${full.days}-day ward: ${full.shifts} shifts across days, evenings and nights. With ${full.people} people it ${fullResult}. With the same shifts and only ${short.people} people, it filled ${short.filled} and left ${short.unfilled} empty rather than break one of its working-time limits.`}
    >
      <div className="grid items-start gap-10 lg:grid-cols-2">
        <div>
          <ScenarioFigures full={full} short={short} />
          <p className="mt-6 text-sm leading-relaxed text-content-secondary">
            {describeBlockingRules(understaffed.blockedBy)} The Unfilled shifts list is the
            engine&apos;s own output for that run.
          </p>
          <p className="mt-3 text-body-sm text-content-tertiary">
            Both are generated test scenarios from Relay&apos;s evaluation harness, not data from a
            real ward.
          </p>
        </div>

        <ReasonsList slots={understaffed.unfilledSlots} />
      </div>
    </LandingSection>
  );
}

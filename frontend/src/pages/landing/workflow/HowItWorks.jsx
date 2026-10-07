// HowItWorks - the workflow from an empty organisation to people reading
// their shifts. Every step is a screen that exists in Relay today.
import { LandingSection } from '../LandingSection.jsx';
import { WorkflowStep } from './WorkflowStep.jsx';
import { STEPS } from './steps.js';

export function HowItWorks() {
  return (
    <LandingSection
      id="how"
      title="How it works"
      intro="From an empty organisation to a published roster, for managers and for everyone on it."
    >
      <ol className="max-w-3xl">
        {STEPS.map((step, i) => (
          <WorkflowStep
            key={step.title}
            number={i + 1}
            step={step}
            isLast={i === STEPS.length - 1}
          />
        ))}
      </ol>
    </LandingSection>
  );
}

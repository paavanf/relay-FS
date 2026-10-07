// EditCheckSection - hand edits are checked against the same rules the
// generator keeps, and those rules belong to the organisation.
//
// The demo and the rules sit side by side on purpose: the verdict on the
// left quotes the rest limit listed on the right.
import { LandingSection } from '../LandingSection.jsx';
import { EditCheckDemo } from './EditCheckDemo.jsx';
import { RuleSentenceList } from '../../availability/RuleSentenceList.jsx';
import { cafe, defaultRosterRules } from '../fixtures/index.js';

export function EditCheckSection() {
  const start = defaultRosterRules;

  return (
    <LandingSection
      id="edits"
      title="Every change is checked before it's saved"
      intro="Managers can move any shift by hand. Relay checks the change against the same rules the generator follows and shows the answer before Save, so a quick edit can't quietly break one."
    >
      <div className="grid items-start gap-10 lg:grid-cols-2">
        <EditCheckDemo />

        <div>
          <h3 className="text-h3 text-content-primary">This cafe&apos;s limits</h3>
          <RuleSentenceList rules={cafe.rules} className="mt-3 space-y-2" />

          <p className="mt-6 text-sm leading-relaxed text-content-secondary">
            Each organisation sets its own. A new one starts at{' '}
            <span className="tabular-nums">{start.minRestHours}</span> hours of rest,{' '}
            <span className="tabular-nums">{start.maxConsecutiveDays}</span> days in a row and{' '}
            <span className="tabular-nums">{start.maxHoursPerWeek}</span> hours a week. Managers
            change them in Settings, and everyone can see them on their Availability page.
          </p>
        </div>
      </div>
    </LandingSection>
  );
}

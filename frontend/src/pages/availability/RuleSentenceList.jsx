// RuleSentenceList - the scheduling rules as plain sentences.
//
// Pure: give it the three rule values and it renders them. SchedulingRulesCard
// feeds it from the server; the landing page feeds it from fixture data. Both
// show identical markup, which is the point of keeping it here rather than
// copying the list into each place.
import { describeRules } from '../../features/organisation/rosterRuleSentences.js';

export function RuleSentenceList({ rules, className }) {
  return (
    <ul className={className ?? 'space-y-1.5'}>
      {describeRules(rules).map((rule) => (
        <li key={rule.key} className="text-body-sm text-content-secondary">
          {rule.lead}{' '}
          <span className="font-medium text-content-primary tabular-nums">{rule.amount}</span>{' '}
          {rule.tail}
        </li>
      ))}
    </ul>
  );
}

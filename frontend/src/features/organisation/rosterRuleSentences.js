// rosterRuleSentences.js
// The scheduling rules said the way a person would say them.
//
// Settings shows the same three numbers as labelled fields, next to the
// inputs that change them - "Minimum rest between shifts (hours): 11". That
// reads correctly beside a form, and badly on a page where nobody can edit
// anything. Here the same values become sentences instead.
//
// Kept beside the API module rather than inside a page, so any page that
// wants to explain the limits reads them from one place.

const HOURS = (n) => `${n} ${n === 1 ? 'hour' : 'hours'}`;
const DAYS = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;

/**
 * Split into three parts so the number can be emphasised and given tabular
 * figures without the sentence being assembled in the component.
 *
 * @returns {{ key: string, lead: string, amount: string, tail: string }[]}
 */
export function describeRules(rules) {
  if (!rules) return [];

  return [
    {
      key: 'minRestHours',
      lead: 'At least',
      amount: HOURS(rules.minRestHours),
      tail: 'between the end of one shift and the start of your next',
    },
    {
      key: 'maxConsecutiveDays',
      lead: 'At most',
      amount: DAYS(rules.maxConsecutiveDays),
      tail: 'in a row before a day off',
    },
    {
      key: 'maxHoursPerWeek',
      lead: 'At most',
      amount: HOURS(rules.maxHoursPerWeek),
      tail: 'in any 7-day period',
    },
  ];
}

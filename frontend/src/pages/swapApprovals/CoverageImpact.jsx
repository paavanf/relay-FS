// CoverageImpact - coverage on every shift a swap touches, role by role,
// before and after. It should never change - each shift keeps its role and
// only changes holder - and the server counted it rather than assumed it,
// so this is a manager confirming it, not taking it on trust.
import { CircleCheck, CircleAlert } from 'lucide-react';
import { shiftTitle } from '../../features/swaps/shiftWords.js';

export function CoverageImpact({ coverage }) {
  const unchanged = coverage.every((row) => row.roles.every((role) => role.before === role.after));
  const Icon = unchanged ? CircleCheck : CircleAlert;

  return (
    <section aria-label="Coverage">
      <h3 className="flex items-center gap-1.5 font-sans text-label text-content-secondary">
        <Icon className={`size-4 ${unchanged ? 'text-success-content' : 'text-danger-content'}`} aria-hidden="true" />
        Coverage {unchanged ? 'unchanged' : 'changes'}
      </h3>
      <ul className="mt-1 space-y-1 text-body-sm">
        {coverage.map((row) => (
          <li key={`${row.date}-${row.shift}`}>
            <span className="text-content-primary">{shiftTitle({ date: row.date, shift: { name: row.shift } })}: </span>
            <span className="text-content-secondary">
              {row.roles.length === 0
                ? 'no roles set for this shift.'
                : row.roles.map((r) => `${r.role} ${r.before} of ${r.needed} before, ${r.after} of ${r.needed} after`).join('; ')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

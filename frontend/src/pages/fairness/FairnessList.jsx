// FairnessList - the manager view on a phone.
//
// A table on a 375px screen would push the deviation - the whole point of the
// page - off to the right. So on small screens each person is a short block:
// name, their deviation bar with its number and words, then the figures.
import { Card } from '../../components/ui/Card.jsx';
import { DeviationBar } from './DeviationBar.jsx';
import { formatHours } from './fairnessWords.js';

export function FairnessList({ rows }) {
  return (
    <Card>
      <ul className="divide-y divide-line-subtle px-4">
        {rows.map((row) => (
          <li key={row.membershipId} className="space-y-2 py-3">
            <p className="font-medium text-content-primary">{row.name}</p>
            {row.measured ? (
              <DeviationBar deviationPercent={row.deviationPercent} />
            ) : (
              <p className="text-body-sm text-content-tertiary">No shifts in this period</p>
            )}
            <p className="text-body-sm tabular-nums text-content-secondary">
              {formatHours(row.hoursWorked)} h · {row.shiftCounts.night} nights · {row.shiftCounts.weekend} weekend
              shifts{row.measured ? ` · burden ${row.normalisedBurden.toFixed(1)}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

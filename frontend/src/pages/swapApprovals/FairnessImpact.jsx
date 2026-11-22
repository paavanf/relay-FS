// FairnessImpact - each person's fairness figures before and after a swap,
// from the same ledger the Fairness page shows, computed both ways by the
// server. Honest about what that ledger counts: published shifts up to the
// end of the latest published roster - so these shifts count already, even
// though nobody has worked them yet, and "after" is what the Fairness page
// will say once the swap is done. Heavy shifts are counted alongside.

const signed = (n) => `${n > 0 ? '+' : ''}${n}%`;
const heavy = (counts) => `${counts.night} nights, ${counts.evening} evenings, ${counts.weekend} weekend shifts`;

function figures(row) {
  if (!row) return 'not counted';
  if (!row.measured) return `not measured yet; ${heavy(row.shiftCounts)}`;
  return `${row.normalisedBurden} burden (${signed(row.deviationPercent)} against the team); ${heavy(row.shiftCounts)}`;
}

export function FairnessImpact({ fairness }) {
  if (!fairness.window) return null;

  return (
    <section aria-label="Fairness">
      <h3 className="font-sans text-label text-content-secondary">Fairness</h3>
      <ul className="mt-1 space-y-1.5 text-body-sm">
        {fairness.people.map((person) => (
          <li key={person.membershipId}>
            <span className="text-content-primary">{person.name}</span>
            <span className="block text-content-secondary">Before: {figures(person.before)}</span>
            <span className="block text-content-secondary">After: {figures(person.after)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-content-tertiary">
        The ledger counts published shifts in the 12 weeks to {fairness.window.endDate}, so these already count; after is what the
        Fairness page will show once the swap is done.
      </p>
    </section>
  );
}

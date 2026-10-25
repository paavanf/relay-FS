// RuleCheck - the constraint engine's verdict on everyone's week after a
// swap: the same check the commit makes last, so a manager sees what the
// commit will see. A tick and "No rule broken", or each broken rule by name.
import { CircleCheck, CircleX } from 'lucide-react';

export function RuleCheck({ rules }) {
  return (
    <section aria-label="Rule check">
      <h4 className="font-sans text-label text-content-secondary">Rule check</h4>
      <ul className="mt-1 space-y-1 text-body-sm">
        {rules.map((person) => {
          const clear = person.hardViolations.length === 0;
          const Icon = clear ? CircleCheck : CircleX;
          return (
            <li key={person.membershipId} className="flex items-start gap-1.5">
              <Icon className={`mt-0.5 size-4 shrink-0 ${clear ? 'text-success-content' : 'text-danger-content'}`} aria-hidden="true" />
              <span>
                <span className="text-content-primary">{person.name}: </span>
                <span className="text-content-secondary">
                  {clear ? 'No rule broken.' : person.hardViolations.map((v) => v.message).join(' ')}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// AvailabilityLegend - what each status actually means to the scheduler.
// Worth stating plainly: "unavailable" is a hard rule, the other two are not.
import { Badge } from '../../components/ui/Badge.jsx';

const meanings = [
  { status: 'unavailable', variant: 'danger', text: 'Never rostered. A hard rule the scheduler will not break.' },
  { status: 'avoid', variant: 'warning', text: 'Rostered only if coverage cannot be met otherwise.' },
  { status: 'prefer', variant: 'success', text: 'Favoured when the roster has a choice.' },
];

export function AvailabilityLegend() {
  return (
    <dl className="space-y-2">
      {meanings.map((meaning) => (
        <div key={meaning.status} className="flex items-start gap-3">
          <dt className="w-24 shrink-0">
            <Badge variant={meaning.variant} className="capitalize">
              {meaning.status}
            </Badge>
          </dt>
          <dd className="text-[13px] text-ink-muted">{meaning.text}</dd>
        </div>
      ))}
    </dl>
  );
}

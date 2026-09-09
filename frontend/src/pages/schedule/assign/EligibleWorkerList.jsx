// EligibleWorkerList - who could legally take an open slot.
//
// Used when filling a hole from the unfilled panel, where the question is
// "who can do this?" rather than "what can this person do?". Anyone the
// server would refuse is shown greyed with the reason, rather than hidden -
// a manager needs to know that Ravi could take it but for the rest rule.
import { cn } from '../../../lib/utils.js';
import { Avatar } from '../../../components/ui/Avatar.jsx';

export function EligibleWorkerList({ candidates, selectedId, onSelect }) {
  if (candidates.length === 0) {
    return <p className="text-body-sm text-content-secondary">Nobody is available for this shift.</p>;
  }

  return (
    <ul className="max-h-64 space-y-1 overflow-y-auto">
      {candidates.map((candidate) => (
        <li key={candidate.member.id}>
          <button
            type="button"
            disabled={!candidate.allowed}
            onClick={() => onSelect(candidate.member)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
              candidate.allowed
                ? 'hover:bg-surface-hover'
                : 'cursor-not-allowed opacity-60',
              selectedId === candidate.member.id && 'bg-brand-subtle',
            )}
          >
            <Avatar name={candidate.member.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm text-content-primary">
                {candidate.member.name}
              </span>
              {!candidate.allowed && (
                <span className="block truncate text-xs text-danger-content">{candidate.reason}</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

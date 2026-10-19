// RoleChoices - which place on the shift this person is filling.
//
// Only the roles they hold are offered: someone without the Charge Nurse
// qualification cannot take the charge nurse's place. Each shows how many of
// its places are still open ("1 of 2 open"), and when only one fits it is
// already chosen. A shift with no coverage rule that day has no roles, and
// shows nothing.
import { cn } from '../../../lib/utils.js';

export function RoleChoices({ choices, chosenId, onChoose, memberName }) {
  if (choices.length === 0) return null;

  const theirs = choices.filter((choice) => choice.held);
  if (theirs.length === 0) {
    return <p className="text-body-sm text-content-secondary">{memberName} holds none of the qualifications this shift needs.</p>;
  }

  return (
    <fieldset>
      <legend className="mb-1.5 text-label text-content-secondary">Role</legend>

      <div className="space-y-1">
        {theirs.map((choice) => (
          <label
            key={choice.qualificationId}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors',
              choice.qualificationId === chosenId ? 'border-brand-solid bg-brand-subtle' : 'border-line-subtle hover:bg-surface-hover',
            )}
          >
            <input
              type="radio"
              name="role"
              value={choice.qualificationId}
              checked={choice.qualificationId === chosenId}
              onChange={() => onChoose(choice.qualificationId)}
              className="size-4"
            />
            <span className="flex-1 text-body-sm text-content-primary">{choice.name}</span>
            <span className="text-xs text-content-secondary tabular-nums">
              {choice.open} of {choice.required} open
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

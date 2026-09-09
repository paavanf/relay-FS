// ShiftChoices - the shift templates available for a cell.
//
// Radio buttons rather than a select: there are rarely more than four, and
// seeing the times side by side is the whole decision.
import { cn } from '../../../lib/utils.js';

export function ShiftChoices({ templates, chosenId, onChoose }) {
  if (templates.length === 0) {
    return (
      <p className="text-body-sm text-content-secondary">
        No shift templates yet. Add one in Settings first.
      </p>
    );
  }

  return (
    <fieldset>
      <legend className="mb-1.5 text-label text-content-secondary">Shift</legend>

      <div className="space-y-1">
        {templates.map((template) => {
          const id = String(template._id ?? template.id);
          const isChosen = id === chosenId;

          return (
            <label
              key={id}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors',
                isChosen
                  ? 'border-brand-solid bg-brand-subtle'
                  : 'border-line-subtle hover:bg-surface-hover',
              )}
            >
              <input
                type="radio"
                name="shift"
                value={id}
                checked={isChosen}
                onChange={() => onChoose(id)}
                className="size-4"
              />
              <span className="flex-1 text-body-sm text-content-primary">{template.name}</span>
              <span className="data text-xs text-content-secondary">
                {template.startLocal}-{template.endLocal}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

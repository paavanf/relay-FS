// ShiftCell - one worker on one day.
//
// Shows the shift if there is one, or stays empty. Colour comes from the
// shift's category using the semantic tokens, so a night reads differently
// from a day without needing to read the words.
//
// Editable cells are real buttons: that gives keyboard operability and a
// focus ring for free, which a clickable <div> would not.
import { cn } from '../../../lib/utils.js';

const categoryStyles = {
  day: 'bg-success-surface text-success-content border-success-border',
  evening: 'bg-warning-surface text-warning-content border-warning-border',
  night: 'bg-info-surface text-info-content border-info-border',
};

export function ShiftCell({ assignment, template, isWeekend, canEdit, onClick }) {
  const label = template?.name ?? 'Shift';
  const times = template ? `${template.startLocal}-${template.endLocal}` : '';

  const content = assignment ? (
    <span
      className={cn(
        'block truncate rounded-sm border px-1.5 py-1 text-[11px] font-medium',
        categoryStyles[template?.category] ?? 'bg-surface-sunken text-content-secondary border-line-subtle',
      )}
    >
      {label}
      <span className="ml-1 tabular-nums">{times}</span>
    </span>
  ) : (
    <span className="block h-[26px]" aria-hidden="true" />
  );

  return (
    <td className={cn('border-b border-l border-line-subtle p-1', isWeekend && 'bg-surface-sunken')}>
      {canEdit ? (
        <button
          type="button"
          onClick={onClick}
          className="block w-full rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-line-focus"
          aria-label={assignment ? `${label}, change` : 'Empty, assign a shift'}
        >
          {content}
        </button>
      ) : (
        content
      )}
    </td>
  );
}

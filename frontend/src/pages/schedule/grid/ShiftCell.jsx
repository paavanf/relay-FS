// ShiftCell - one worker on one day.
//
// A shift is a block in its category's colour, which follows the sky - day
// light, evening mid-tone, night dark and solid - with a solid left edge
// and the category's icon, so it reads without reading the words, and never
// by colour alone. An empty day stays empty.
//
// Editable cells are real buttons: that gives keyboard operability and a
// focus ring for free, which a clickable <div> would not.
import { CATEGORY_ICONS, CATEGORY_EDGES } from '../../../components/ui/shiftCategories.js';
import { cn } from '../../../lib/utils.js';

const fills = {
  day: 'bg-shift-day-surface text-shift-day-content',
  evening: 'bg-shift-evening-surface text-shift-evening-content',
  night: 'bg-shift-night-surface text-shift-night-content',
};

export function ShiftCell({ assignment, template, isWeekend, canEdit, onClick }) {
  const label = template?.name ?? 'Shift';
  const times = template ? `${template.startLocal}-${template.endLocal}` : '';
  const category = template?.category;
  const Icon = CATEGORY_ICONS[category];
  const style = fills[category]
    ? `${fills[category]} ${CATEGORY_EDGES[category]}`
    : 'bg-surface-sunken text-content-secondary border-l-line-strong';

  const content = assignment ? (
    <span className={cn('flex h-7 items-center gap-1.5 rounded-sm border-l-[3px] pr-1.5 pl-1 text-[11px] font-semibold', style)}>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span className="truncate">
        {label}
        <span className="data ml-1 font-normal">{times}</span>
      </span>
    </span>
  ) : (
    <span className="block h-7" aria-hidden="true" />
  );

  return (
    <td className={cn('border-b border-l border-line-subtle p-1', isWeekend && 'bg-surface-weekend')}>
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

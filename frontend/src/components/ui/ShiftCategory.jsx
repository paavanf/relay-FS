// ShiftCategory - CategoryBadge, a shift's category (day, evening, night) as
// a label beside its name: the category's own colour, which follows the sky
// - day light, evening mid-tone, night dark and solid - and its own icon, so
// colour is never the only signal. The icons and edges themselves live in
// shiftCategories.js, for parts that draw their own shift.
import { CATEGORY_ICONS } from './shiftCategories.js';
import { cn } from '../../lib/utils.js';

const badgeStyles = {
  day: 'bg-shift-day-surface text-shift-day-content',
  evening: 'bg-shift-evening-surface text-shift-evening-content',
  night: 'bg-shift-night-surface text-shift-night-content',
};

export function CategoryBadge({ category, className }) {
  const Icon = CATEGORY_ICONS[category];
  if (!Icon) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold capitalize',
        badgeStyles[category],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {category}
    </span>
  );
}

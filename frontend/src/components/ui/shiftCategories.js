// shiftCategories.js
// A shift category's icon and solid left edge, for parts that draw their own
// shift - the roster grid's blocks, a shift card. Day, evening and night
// follow the sky, and each has its own icon, so colour is never the only
// signal. CategoryBadge (ShiftCategory.jsx) is the label form. Kept apart
// from the component so hot reloading keeps working.
import { Moon, Sun, Sunset } from 'lucide-react';

export const CATEGORY_ICONS = { day: Sun, evening: Sunset, night: Moon };

export const CATEGORY_EDGES = {
  day: 'border-l-shift-day-edge',
  evening: 'border-l-shift-evening-edge',
  night: 'border-l-shift-night-edge',
};

/** A category's icon colour on an ordinary surface (its edge colour, 3:1 or more). */
export const CATEGORY_ICON_COLOURS = {
  day: 'text-shift-day-edge',
  evening: 'text-shift-evening-edge',
  night: 'text-shift-night-edge',
};

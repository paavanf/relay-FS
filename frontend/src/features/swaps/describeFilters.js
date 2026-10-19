// describeFilters.js
// What an offer says its owner would take in return, as a short phrase for
// the Swaps page: "Any shift", "Day shifts", "Day or night shifts, on Sat or
// Sun". Empty lists mean any; weekdays are numbered from Sunday = 0, as the
// API stores them, and listed from Monday, as a rota reads.

export const SHIFT_TYPES = [
  { value: 'day', label: 'Day' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const or = (words) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} or ${words.at(-1)}`);

export function describeFilters(filters) {
  const types = SHIFT_TYPES.filter((t) => filters?.categories?.includes(t.value)).map((t) => t.label.toLowerCase());
  const days = WEEKDAYS.filter((d) => filters?.daysOfWeek?.includes(d.value)).map((d) => d.label);

  const kind = types.length > 0 ? `${or(types)} shifts` : days.length > 0 ? 'any shift' : 'Any shift';
  const phrase = days.length > 0 ? `${kind}, on ${or(days)}` : kind;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

// noticeWords.js
// Small pieces of wording every notification shares, so a shift or a list
// of people reads the same in all of them.
//
//   shiftWords   "night shift on Tuesday 17 March"
//   listWords    "Asha, Ben and Chen"
//   dateRange    "9 to 22 November", "30 November to 13 December"
//   sentence     a reason given without its full stop, ready to sit mid-sentence

const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const dayOnly = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' });

// Dates here are local calendar days ('2026-03-17'), read as such.
const asDay = (isoDate) => new Date(`${isoDate}T00:00:00Z`);

export const shiftWords = (shift) =>
  shift ? `${(shift.shift?.name ?? 'Shift').toLowerCase()} shift on ${longDate.format(asDay(shift.date))}` : 'shift';

export function listWords(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

export function dateRange(startDate, endDate) {
  const sameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
  const from = sameMonth ? dayOnly.format(asDay(startDate)) : dayMonth.format(asDay(startDate));
  return `${from} to ${dayMonth.format(asDay(endDate))}`;
}

export const withoutFullStop = (text) => text.replace(/[.\s]+$/, '');

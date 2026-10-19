// unreadLabel.js
// What the bell's badge says: nothing when everything is read, the count up
// to nine, then "9+" - a badge that has to grow to fit "143" says less than
// one that says "a lot" in the same small space.

export function unreadLabel(count) {
  if (!count || count < 1) return null;
  return count > 9 ? '9+' : String(count);
}

/** The bell's accessible name, with the whole count rather than "9+". */
export function bellName(count) {
  if (!count || count < 1) return 'Notifications';
  return `Notifications, ${count} unread`;
}

// sortRows.js
// The order both manager layouts share: by deviation, heaviest first (or
// lightest first), with people who have nothing to measure always last.

export function sortRows(rows, heaviestFirst) {
  const measured = rows
    .filter((row) => row.measured)
    .sort((a, b) => (heaviestFirst ? b.deviationPercent - a.deviationPercent : a.deviationPercent - b.deviationPercent));

  return [...measured, ...rows.filter((row) => !row.measured)];
}

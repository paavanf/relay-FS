// evaluationTable.js
// How evaluate-generation.js prints its numbers: one row per scenario, with
// the slots, how many were filled, the objective, the iterations used, the
// time taken and whether the result was legal.

export function pad(value, width, right = true) {
  const text = String(value);
  return right ? text.padStart(width) : text.padEnd(width);
}

export function printTable(rows, label) {
  console.log(`\n${label}`);
  console.log(
    pad('Scenario', 44, false) + pad('Slots', 7) + pad('Filled', 7) + pad('Unfilled', 9) +
      pad('Objective', 11) + pad('Iters', 7) + pad('ms', 7) + pad('Legal', 7),
  );
  console.log('-'.repeat(99));

  for (const { name, m } of rows) {
    console.log(
      pad(name, 44, false) + pad(m.totalSlots, 7) + pad(m.filled, 7) + pad(m.unfilledCount, 9) +
        pad(Math.round(m.objectiveScore), 11) + pad(m.iterations, 7) + pad(m.wallMs, 7) +
        pad(m.isValid ? 'yes' : `NO(${m.violations})`, 7),
    );
  }
}

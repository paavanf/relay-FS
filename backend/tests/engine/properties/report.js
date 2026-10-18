// report.js
// Prints a measurement into the test output, for the tests whose numbers are
// themselves the result - how often the swap search found what, and how
// often the ranking bound skipped work. Written straight to stdout rather
// than through console, which the lint rules keep for warnings and errors.

export function report(...lines) {
  process.stdout.write(`${lines.join('\n')}\n`);
}

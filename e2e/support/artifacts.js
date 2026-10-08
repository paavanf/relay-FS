// artifacts.js
// Where the suite leaves things for a person to look at: screenshots, and the
// numbers some checks measure. Everything lands under e2e/artifacts/, which
// git ignores.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARTIFACTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'artifacts');

export function artifactPath(...parts) {
  const file = path.join(ARTIFACTS, ...parts);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return file;
}

/** Saves measured numbers as e2e/artifacts/numbers/<name>.json, and on the test's report. */
export function recordNumbers(testInfo, name, numbers) {
  fs.writeFileSync(artifactPath('numbers', `${name}.json`), `${JSON.stringify(numbers, null, 2)}\n`);
  testInfo.annotations.push({ type: name, description: JSON.stringify(numbers) });
}

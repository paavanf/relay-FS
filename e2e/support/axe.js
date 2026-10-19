// axe.js
// Runs axe - the accessibility engine - on whatever a page shows, against
// WCAG 2.1 A and AA, and keeps everything it found for a person to read
// (e2e/artifacts/numbers/axe.json). Returns the serious and critical
// problems, each as one line, so a spec can fail on exactly those.

import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { artifactPath } from './artifacts.js';

const found = {};
const SERIOUS = new Set(['serious', 'critical']);

const describe = (violation) =>
  `${violation.id} (${violation.impact}): ${violation.help} - ${violation.nodes
    .slice(0, 3)
    .map((node) => node.target.join(' '))
    .join(' | ')}`;

export async function axeProblems(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

  found[label] = violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, example: v.nodes[0]?.html.slice(0, 300) }));
  fs.writeFileSync(artifactPath('numbers', 'axe.json'), `${JSON.stringify(found, null, 2)}\n`);

  return violations.filter((v) => SERIOUS.has(v.impact)).map(describe);
}

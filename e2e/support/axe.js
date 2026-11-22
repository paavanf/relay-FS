// axe.js
// Runs axe - the accessibility engine - on whatever a page shows, against
// WCAG 2.1 A and AA and axe's best-practice rules as well: one main landmark
// on every page, all content inside landmarks, headings in order, and the
// like. Keeps everything it found for a person to read
// (e2e/artifacts/numbers/axe.json), and returns every problem - minor ones
// included, since a page with no main landmark is only "moderate" - each as
// one line, so a spec fails on any of them.

import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { artifactPath } from './artifacts.js';

const RULE_SETS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const found = {};

const describe = (violation) =>
  `${violation.id} (${violation.impact}): ${violation.help} - ${violation.nodes
    .slice(0, 3)
    .map((node) => node.target.join(' '))
    .join(' | ')}`;

export async function axeProblems(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(RULE_SETS).analyze();

  found[label] = violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, example: v.nodes[0]?.html.slice(0, 300) }));
  fs.writeFileSync(artifactPath('numbers', 'axe.json'), `${JSON.stringify(found, null, 2)}\n`);

  return violations.map(describe);
}

// dialogNames.test.js
// Every dialog in the app has an accessible name. A dialog built on the
// shared Dialog is named by its DialogTitle (Dialog.test.jsx shows how), so
// every file that opens one must render a DialogTitle with something in it;
// anything else with role="dialog" must name itself, with aria-labelledby or
// aria-label. Read from the source, so a new dialog cannot slip past.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SHARED = path.join(SRC, 'components', 'ui', 'dialog');

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });
}

const files = sourceFiles(SRC).filter((file) => !file.startsWith(SHARED));
const read = (file) => fs.readFileSync(file, 'utf8');
const relative = (file) => path.relative(SRC, file).replaceAll('\\', '/');

describe('every dialog has an accessible name', () => {
  const shared = files.filter((file) => /<Dialog[\s>]/.test(read(file)));

  it('finds every dialog built on the shared Dialog', () => {
    expect(shared.length).toBeGreaterThanOrEqual(18);
  });

  it('gives each of them a title with something in it', () => {
    const untitled = shared.filter((file) => !/<DialogTitle[^>]*>\s*[^<\s]/.test(read(file)));
    expect(untitled.map(relative)).toEqual([]);
  });

  it('has every other role="dialog" name itself', () => {
    const own = files.filter((file) => read(file).includes('role="dialog"'));
    expect(own.map(relative)).toContain('features/notifications/components/NotificationPanel.jsx');
    const unnamed = own.filter((file) => !/aria-labelledby=|aria-label=/.test(read(file)));
    expect(unnamed.map(relative)).toEqual([]);
  });
});

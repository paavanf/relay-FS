// globalSetup.js
// Playwright calls this once before the first spec, and the function it
// returns once after the last - whether the specs passed or failed.

import { startStack } from './startStack.js';

export default async function globalSetup() {
  const stack = await startStack();

  // support/stack.js reads this in every spec; test workers inherit it.
  process.env.E2E_STACK = JSON.stringify(stack.info);
  const t = stack.timings;
  console.log(`\n  Stack ready: app ${stack.info.baseURL}, API ${stack.info.apiURL}, database ${stack.info.database} (in memory)`);
  console.log(`  Seconds after start - database ${t.database}, build ${t.build}, seeded ${t.seeded}, backend ${t.backend}, preview ${t.preview}\n`);

  return async () => {
    await stack.stop();
  };
}

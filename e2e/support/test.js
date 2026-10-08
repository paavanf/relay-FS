// test.js
// The suite's own `test`: Playwright's, plus a `sessions` fixture.
//
//   sessions.open(person, options)  signs someone in, in a context of their own
//   sessions.anonymous(options)     a signed-out context
//
// After every test, each session it opened is closed and checked: no
// uncaught exception in any of its pages, no console error, no 5xx. That
// makes "nothing broke behind the scenes" part of every check, not only the
// every-page one. How many API requests the test made is recorded as an
// annotation, to keep an eye on the API's rate limit.

import { test as base, expect } from '@playwright/test';
import { openSession } from './session.js';

export const test = base.extend({
  sessions: async ({ browser }, use, testInfo) => {
    const opened = [];
    const open = async (who, options) => {
      const session = await openSession(browser, who, options);
      opened.push(session);
      return session;
    };

    await use({ open, anonymous: (options) => open(null, options) });

    for (const session of opened) await session.context.close();

    const requests = opened.reduce((sum, s) => sum + s.problems.apiRequests, 0);
    testInfo.annotations.push({ type: 'api-requests', description: String(requests) });

    for (const { who, problems } of opened) {
      const whose = who?.name ?? 'a signed-out visitor';
      expect(problems.pageErrors, `uncaught errors in pages seen by ${whose}`).toEqual([]);
      expect(problems.consoleErrors, `console errors seen by ${whose}`).toEqual([]);
      expect(problems.serverErrors, `5xx responses seen by ${whose}`).toEqual([]);
    }
  },
});

export { expect };

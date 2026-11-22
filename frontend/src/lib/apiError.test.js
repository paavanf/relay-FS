// apiError.test.js
// A 5xx with no JSON body did not come from Relay's API - it is a proxy or a
// gateway that could not reach the server - and a visitor is told so in plain
// words. An error the API sent keeps its own message and code.

import { describe, it, expect } from 'vitest';
import { errorFor } from './apiError.js';

describe('API errors, as messages', () => {
  it("says the server is not answering when a gateway's 5xx has no JSON body", () => {
    const error = errorFor({ status: 502, statusText: 'Bad Gateway' }, null);
    expect(error).toMatchObject({ status: 502, message: "Relay's server is not answering. Try again in a moment." });
  });

  it("keeps the API's own message and code", () => {
    const error = errorFor({ status: 409, statusText: 'Conflict' }, { error: { code: 'CONFLICT', message: 'Already running.' } });
    expect(error).toMatchObject({ status: 409, code: 'CONFLICT', message: 'Already running.' });
  });
});

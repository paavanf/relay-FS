// apiError.js
// The error lib/apiClient.js throws for a response that is not 2xx, and how
// it turns the API's error envelope into a message a person can act on.

// Error thrown for any non-2xx response, so callers can read err.status etc.
export class ApiError extends Error {
  constructor(message, { status, code, details, body } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    // The decoded response body. Useful when an endpoint returns something
    // meaningful alongside a non-2xx status (e.g. /api/health when the API is
    // up but its database is not).
    this.body = body;
  }
}

// A validation failure sends the generic message "Validation failed" and puts
// the text a person can actually act on inside details:
//   { body: { fieldErrors: { password: ['Password must contain a number'] } } }
// Lift those out so forms show the real reason instead of the generic one.
function readableMessage(error, fallback) {
  const messages = [];

  for (const target of Object.values(error?.details ?? {})) {
    for (const fieldMessages of Object.values(target?.fieldErrors ?? {})) {
      messages.push(...fieldMessages);
    }
    messages.push(...(target?.formErrors ?? []));
  }

  if (messages.length === 0) return error?.message ?? fallback;

  // Cap it: a toast showing every field at once is unreadable.
  return messages.slice(0, 3).join('. ');
}

/** The ApiError for a response that is not 2xx, given its decoded body (null when it had none). */
export function errorFor(response, payload) {
  // Every error the API itself sends carries an {error:{...}} envelope. A
  // 5xx with no JSON body therefore did not come from the API - it is the
  // dev proxy (or a gateway) saying it could not reach the backend at all.
  // Reporting that as "Internal Server Error" sends you hunting for a
  // server bug that does not exist.
  if (payload === null && response.status >= 500) {
    return new ApiError('Cannot reach the Relay API. Is the backend running?', { status: response.status });
  }

  const error = payload?.error ?? {};
  return new ApiError(readableMessage(error, response.statusText), {
    status: response.status,
    code: error.code,
    details: error.details,
    body: payload,
  });
}

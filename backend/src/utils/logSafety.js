// logSafety.js
// What a request's log line may contain. Raw secrets travel in a few places
// a default request logger writes down: the password-reset and invite links
// carry their token in the path (/auth/reset-password/<token>,
// /invites/<token>), and a login response sets the refresh token in a
// Set-Cookie header. So the request is logged as its id, method, address and
// masked URL - no headers, no params - and the response as its status alone.

const TOKEN_IN_PATH = /(\/(?:reset-password|invites)\/)[^/?#]+/g;

/** '/api/v1/invites/abc123/accept' -> '/api/v1/invites/[redacted]/accept' */
export const maskUrl = (url = '') => String(url).replace(TOKEN_IN_PATH, '$1[redacted]');

/** pino-http's request serializer. */
export function requestForLog(req) {
  return { id: req.id, method: req.method, url: maskUrl(req.url), remoteAddress: req.remoteAddress };
}

/** pino-http's response serializer. */
export function responseForLog(res) {
  return { statusCode: res.statusCode };
}

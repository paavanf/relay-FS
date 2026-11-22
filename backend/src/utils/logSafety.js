// logSafety.js
// What a request's log line may contain. Raw secrets travel in places a
// default request logger writes down: an invite link carries its token in
// the path (/invites/<token>), and every signed-in request carries its access
// token in the Authorization header. So the request is logged as its id,
// method, address and masked URL - no headers, no params, no body - and the
// response as its status alone. An email address that a log line names - a
// message sent, or not - is masked too.

const TOKEN_IN_PATH = /(\/invites\/)[^/?#]+/g;

/** '/api/v1/invites/abc123/accept' -> '/api/v1/invites/[redacted]/accept' */
export const maskUrl = (url = '') => String(url).replace(TOKEN_IN_PATH, '$1[redacted]');

/** 'wren@example.com' -> 'w***@example.com': enough to tell where a message went, never who to. */
export function maskEmail(email) {
  const [name, domain] = String(email ?? '').split('@');
  return domain ? `${name.slice(0, 1)}***@${domain}` : '***';
}

/** pino-http's request serializer. */
export function requestForLog(req) {
  return { id: req.id, method: req.method, url: maskUrl(req.url), remoteAddress: req.remoteAddress };
}

/** pino-http's response serializer. */
export function responseForLog(res) {
  return { statusCode: res.statusCode };
}

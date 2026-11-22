// requestContext.js
// Gives every request an id - in the response header, the logs and error
// bodies - so one request can be followed through all three.

import { randomUUID } from 'node:crypto';
import { REQUEST_ID_HEADER } from '../config/constants.js';

// A caller may pass its own id to follow a request through the logs - but
// only a short, plain one; anything else is replaced, so the header cannot
// be used to write arbitrary text into every log line.
const SAFE_ID = /^[\w-]{1,64}$/;

/** Assigns every request an id, on req.id and in the response header. */
export function requestContext(req, res, next) {
  const given = req.get(REQUEST_ID_HEADER);
  const requestId = given && SAFE_ID.test(given) ? given : randomUUID();
  req.id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

export default requestContext;

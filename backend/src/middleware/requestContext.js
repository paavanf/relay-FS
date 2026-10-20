// requestContext.js
// Gives every request an id - in the response header, the logs and error
// bodies - and keeps it where code deeper in the request can find it.

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { REQUEST_ID_HEADER } from '../config/constants.js';

const storage = new AsyncLocalStorage();

// A caller may pass its own id to follow a request through the logs - but
// only a short, plain one; anything else is replaced, so the header cannot
// be used to write arbitrary text into every log line.
const SAFE_ID = /^[\w-]{1,64}$/;

/** Assigns every request an id and makes it available to anything downstream. */
export function requestContext(req, res, next) {
  const given = req.get(REQUEST_ID_HEADER);
  const requestId = given && SAFE_ID.test(given) ? given : randomUUID();
  req.id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  storage.run({ requestId, startedAt: Date.now() }, next);
}

export function getRequestContext() {
  return storage.getStore();
}

export default requestContext;

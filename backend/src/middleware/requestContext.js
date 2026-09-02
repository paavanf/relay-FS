import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { REQUEST_ID_HEADER } from '../config/constants.js';

const storage = new AsyncLocalStorage();

/** Assigns every request an id and makes it available to anything downstream. */
export function requestContext(req, res, next) {
  const requestId = req.get(REQUEST_ID_HEADER) || randomUUID();
  req.id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  storage.run({ requestId, startedAt: Date.now() }, next);
}

export function getRequestContext() {
  return storage.getStore();
}

export default requestContext;

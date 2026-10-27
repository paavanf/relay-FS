// The one place the app talks to the backend. Components never call fetch()
// directly - they use this. Handles auth headers, JSON and 401 refresh, and
// throws an ApiError (lib/apiError.js) for anything that is not 2xx. It also
// tells lib/slowRequests.js how long each request took, so a server waking
// up from sleep gets a banner rather than a frozen-looking page.
// Pass { expectSlow: true } for requests that are slow because they work.
//
// The token is the signed-in person's Supabase access token (lib/auth/). A
// 401 means it has expired: it is refreshed once, and the request tried once
// more. If that fails too, the session is over and the auth client says so.

import { currentAccessToken, refreshAccessToken } from './auth/session.js';
import { trackRequest } from './slowRequests.js';
import { ApiError, errorFor } from './apiError.js';

export { ApiError };

const BASE_URL = '/api/v1';

// Feature endpoints live under /api/v1. A path that already starts with /api
// is used exactly as given, which lets us reach the backend's /api/health.
function buildUrl(path) {
  return path.startsWith('/api/') ? path : BASE_URL + path;
}

function buildHeaders(body, token) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function sendRequest(method, path, body, token) {
  return fetch(buildUrl(path), {
    method,
    headers: buildHeaders(body, token),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function request(method, path, body, { expectSlow = false } = {}) {
  const done = trackRequest({ expectSlow });
  let response;

  try {
    response = await sendRequest(method, path, body, await currentAccessToken());
  } catch {
    // Network-level failure: server down, DNS, offline.
    done({ answered: false });
    throw new ApiError('Cannot reach the Relay API.', { status: 0 });
  }
  done();

  // Access token expired - refresh once, then retry the original request.
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await sendRequest(method, path, body, newToken);
    }
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) throw errorFor(response, payload);
  return payload;
}

export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  delete: (path, options) => request('DELETE', path, undefined, options),
};

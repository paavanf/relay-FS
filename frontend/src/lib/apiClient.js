// The one place the app talks to the backend. Components never call fetch()
// directly - they use this. Handles auth headers, JSON, and 401 refresh.

import { getToken } from './tokenStore.js';
import { refreshAccessToken } from './refreshHelper.js';

const BASE_URL = '/api/v1';

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

// Feature endpoints live under /api/v1. A path that already starts with /api
// is used exactly as given, which lets us reach the backend's /api/health.
function buildUrl(path) {
  return path.startsWith('/api/') ? path : BASE_URL + path;
}

function buildHeaders(body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function sendRequest(method, path, body) {
  return fetch(buildUrl(path), {
    method,
    credentials: 'include', // send the refresh cookie
    headers: buildHeaders(body),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function request(method, path, body) {
  let response;

  try {
    response = await sendRequest(method, path, body);
  } catch {
    // Network-level failure: server down, DNS, offline.
    throw new ApiError('Cannot reach the Relay API.', { status: 0 });
  }

  // Access token expired - refresh once, then retry the original request.
  if (response.status === 401 && !path.startsWith('/auth/')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await sendRequest(method, path, body);
    }
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload?.error ?? {};
    throw new ApiError(error.message ?? response.statusText, {
      status: response.status,
      code: error.code,
      details: error.details,
      body: payload,
    });
  }

  return payload;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};

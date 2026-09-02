// Silent refresh logic, kept out of apiClient.js so that file stays small.
//
// When a request comes back 401 the access token has expired. We ask the
// backend for a new one using the refresh cookie. If several requests fail at
// the same time we only want ONE refresh call, so we remember the in-flight
// promise and let everyone else wait on it.

import { setToken, clearToken } from './tokenStore.js';

let refreshPromise = null;

async function askBackendForNewToken() {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  const data = await response.json();
  return data.accessToken;
}

// Returns the new access token, or null if the session is really gone.
export async function refreshAccessToken() {
  // Someone else is already refreshing - wait for their result.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = askBackendForNewToken()
    .then((newToken) => {
      setToken(newToken);
      return newToken;
    })
    .catch(() => {
      clearToken();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

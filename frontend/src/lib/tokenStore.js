// Stores the JWT access token in memory (NOT localStorage).
// This is safer against XSS attacks - a stolen script can't read it.
// The refresh cookie handles persistence across page refreshes.

let token = null;
const subscribers = [];

export function getToken() {
  return token;
}

export function setToken(newToken) {
  token = newToken;
  subscribers.forEach((fn) => fn(newToken));
}

export function clearToken() {
  token = null;
  subscribers.forEach((fn) => fn(null));
}

export function subscribe(fn) {
  subscribers.push(fn);
  return () => {
    const index = subscribers.indexOf(fn);
    if (index !== -1) subscribers.splice(index, 1);
  };
}

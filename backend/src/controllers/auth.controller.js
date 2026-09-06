// auth.controller.js
// HTTP layer for auth endpoints. Parses requests, calls services, sends
// responses, and owns the refresh-token cookie.
//
// Note: input is read from req.valid.body, not req.body. The validate
// middleware puts the *parsed* Zod output there, which is where the email has
// actually been trimmed and lowercased.

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
  signAccessToken,
  createRefreshToken,
} from '../services/auth/index.js';
import { constants } from '../config/constants.js';
import { env } from '../config/env.js';

// httpOnly  - unreadable by JavaScript, so XSS cannot steal the session
// secure    - HTTPS only, outside development
// sameSite  - not sent on cross-site requests, which blunts CSRF
// path      - only ever sent to the auth endpoints that need it
// maxAge    - persistent, so the session survives closing the browser
//
// The cookie lives in one browser profile and is never carried in a URL, so
// another person on another browser or machine has no cookie at all and
// always starts at the login page. The one case this cannot cover is someone
// using the *same* browser profile - to a cookie, the profile is the identity
// - which is what the logout button is for.
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
  path: constants.REFRESH_COOKIE_PATH,
  maxAge: constants.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
};

// Mints a session for this user and sets the refresh cookie. Only login uses
// it - registering does not sign you in.
async function issueSession(user, req, res) {
  const accessToken = signAccessToken(user._id);

  const refreshToken = await createRefreshToken(user._id, {
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  res.cookie(constants.REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  // Return the user and memberships so the frontend can populate its state
  // immediately instead of making a second call to /auth/me.
  const me = await getCurrentUser(user._id);

  return { accessToken, user: me.user, memberships: me.memberships };
}

export async function register(req, res) {
  const user = await registerUser(req.valid.body);

  // Creating an account deliberately does NOT start a session: no access
  // token, no refresh cookie. The frontend sends the user to the login page
  // to sign in with the credentials they just chose.
  res.status(201).json({
    message: 'Account created successfully',
    user: { id: user._id.toString(), email: user.email, name: user.name },
  });
}

export async function login(req, res) {
  const user = await loginUser(req.valid.body);
  const session = await issueSession(user, req, res);

  res.json(session);
}

export async function refresh(req, res) {
  const rawToken = req.cookies?.[constants.REFRESH_COOKIE_NAME];
  const { accessToken } = await refreshAccessToken(rawToken);

  res.json({ accessToken });
}

export async function logout(req, res) {
  const rawToken = req.cookies?.[constants.REFRESH_COOKIE_NAME];
  await logoutUser(rawToken);

  res.clearCookie(constants.REFRESH_COOKIE_NAME, { path: constants.REFRESH_COOKIE_PATH });
  res.json({ message: 'Logged out' });
}

export async function me(req, res) {
  // req.userId is set by the authenticate middleware.
  const result = await getCurrentUser(req.userId);
  res.json(result);
}

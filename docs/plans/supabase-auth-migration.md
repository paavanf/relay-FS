# Supabase Auth migration: Phase 0 plan

Branch `supabase-auth`. This was the Phase 0 plan: research, inventory, and the design approved before any code was written. It is kept as the record of why things are as they are. **It describes the old sign-in as it was then:** wherever it says "today" or "now" - the refresh cookie, the password hashes, the lockout - it means before the move, and none of that exists any more. One later decision is not in it: Relay's 7-day limit on a sign-in, kept by the browser and by the API. The setup itself is in [docs/deploy/SUPABASE.md](../deploy/SUPABASE.md), and sign-in and sessions are explained in the README.

**Approved, with these changes:**

- **D1: localStorage, not sessionStorage.** sessionStorage gives no real protection against a script in the page, which can read both; it only shortens the session. The XSS trade-off is in the README's *Sessions* section. (Note: before the move, a newly opened tab did start signed out - `lib/tabSession.js` - so this is a change of behaviour.)
- **D2: approved.** The token fragment is cleared from the address as soon as it is read (`lib/auth/authRedirect.js`, with `history.replaceState`), and `Referrer-Policy: no-referrer` stays.
- **D3: approved.** "Confirm email" must stay on in the production project (SUPABASE.md, section 2).
- **D4: approved.** The keep-alive also fails the nightly run, visibly, when Supabase cannot be reached, and SUPABASE.md explains how to restore a paused project.
- **D5, D6: approved.**

The sections below are the plan as it was proposed.

Relay moves sign-in, sign-up, password reset and "Sign in with Google" to Supabase Auth. Supabase holds **identities only**. Users, memberships, roles, rosters, swaps and fairness stay in MongoDB, keyed by Relay's own user `_id`.

The seam is `req.userId`. Today `authenticate` sets it from Relay's own JWT. Afterwards it sets it from the Relay user that matches a verified Supabase token. Nothing downstream of `authenticate` changes, so multi-tenancy doesn't change.

---

## 1. Decisions for you

Each decision has a recommendation. If you approve the plan as it stands, I go with all six.

| # | Question | Recommendation | Why |
|---|---|---|---|
| D1 | Where the browser keeps the Supabase session | **`sessionStorage`** (one session per tab) | This keeps today's deliberate behaviour (`lib/tabSession.js`): a new tab starts signed out, and F5 keeps you signed in. On a shared ward computer, closing the tab signs you out. With `localStorage` (Supabase's default), the next person at that computer would open Relay already signed in as you. With memory only, every reload would sign you out. |
| D2 | Auth flow | **Implicit** (the supabase-js default) | Email links open in a new tab. PKCE stores its code verifier in the tab that started the flow, so with per-tab storage the confirmation and reset links would fail. PKCE would also need custom email templates in both projects. |
| D3 | How Relay knows an email is proven before linking an existing account | **The backend reads Supabase's public settings and links only when "Confirm email" is on** | No token claim says that an email is verified (§2.8). |
| D4 | Keep-alive for the free project | **Nightly Auth Admin API calls**, a separate step in the nightly workflow | The docs say "API calls to your project" generate activity, and this needs no setup. If a pause ever happens anyway, the fallback is a nightly read of a one-row table through the REST API (SQL in the docs). |
| D5 | Old password data in Atlas | **Add `backend/scripts/cleanup-legacy-auth.js`**: dry run by default, `--yes` to apply, and you run it after the switch | Without it, every account that is never linked keeps its Argon2 hash forever. |
| D6 | A change-password screen | **Don't add one** | Relay has no such screen today, only forgot/reset, and Supabase's reset flow covers the need. "Hide change-password UI for demo accounts" therefore means that the reset page refuses demo accounts. |

**D1 is the one place where this migration weakens existing hardening.** Today the refresh token sits in an httpOnly cookie that no script can read. Afterwards it sits in `sessionStorage`, where any script running in the page can read it. These protections remain:

- The CSP already blocks inline and third-party scripts (`script-src 'self'` plus one hash).
- The app renders no raw HTML: there is no `dangerouslySetInnerHTML` anywhere in `frontend/src`.
- Signing out revokes the session.
- Supabase refresh tokens are single-use, with reuse detection.

The only way to keep the cookie is a backend-for-frontend that routes every refresh through Render. I don't recommend it. It works against supabase-js, adds endpoints and CSRF surface, and puts a sleeping free-tier instance in the path of every refresh.

---

## 2. Research findings (0a)

All of this was checked this week against current documentation (sources at the end of the section). Text in quotation marks is quoted exactly.

### 2.1 Free plan limits
- Auth: "50,000 monthly active users".
- Projects: "Limit of 2 active projects". A dev project plus a prod project uses both slots. The pricing page doesn't say whether the limit applies per organisation or per user.
- Custom SMTP and social OAuth providers are "Included".

### 2.2 Pausing after inactivity
- A project pauses after no "user database activity" "over a 7-day period". The page says: "Typically a few user requests to the database each day over the previous week is enough."
- To prevent a pause, visit the dashboard or "generate enough activity through API calls or your connected application".
- "You can restore a paused project for up to 1 year after it was paused." A restored project "will return to its previous state, including data and configurations."
- **A health request to Relay never reaches Supabase, so it cannot keep the project awake.** A nightly Auth Admin API call is an API call to the project and reads `auth.users` in its database. The docs don't separate Auth requests from REST requests, so this is the docs' wording rather than an explicit guarantee (D4).

### 2.3 Email
- Default service: "Supabase Auth will refuse to deliver messages to addresses that are not part of the project's team." The rate is "Currently … set to 2 messages per hour."
- Custom SMTP: "Supabase Auth works with any email sending service that supports the SMTP protocol." Gmail isn't in its list of examples, but nothing rules it out. Supabase needs the host, port, user, password and a From address.
- With custom SMTP: "a low rate-limit of 30 messages per hour is imposed". You can raise it on the Rate Limits page.
- Gmail SMTP:
  - Settings: `smtp.gmail.com`, port 587 (TLS) or 465 (SSL), the full email address as username, and an app password.
  - App passwords "can only be used with accounts that have 2-Step Verification turned on". They aren't offered when 2-Step Verification uses only security keys, on work or school accounts, or with Advanced Protection.
  - Google says "App passwords aren't recommended and are unnecessary in most cases". Supabase's SMTP settings can't use Google sign-in, so an app password is the only way to use Gmail here.
  - A personal account that sends "more than 500 emails sent in a day" is blocked for 1 to 24 hours.
- Supabase's own servers send these emails, so Render's SMTP block doesn't apply. Relay's own invite emails don't change.
- Resend, which Relay already uses for invites, would need a verified domain to email arbitrary addresses. Gmail doesn't need one.

### 2.4 JWT verification
- "Starting October 1, 2025, all new projects will use asymmetric JWTs by default."
- ES256 is the preferred algorithm and RS256 is supported. HS256 is "Not recommended for production applications".
- The JWKS endpoint is `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`. Supabase's edge caches it for 10 minutes.
- Claims:
  - `iss` is `https://<ref>.supabase.co/auth/v1`.
  - `aud` is `authenticated` for a signed-in user.
  - `sub` is the user's UUID.
  - `email` is a required claim, and `is_anonymous` and `role` are present.
- Access tokens last 1 hour by default.
- **So Relay doesn't need `SUPABASE_JWT_SECRET`.** The JWTs page itself advises against verifying HS256 tokens locally. If your project's JWT Keys page shows a legacy secret, migrate the project to asymmetric keys rather than putting that secret on Render.

### 2.5 Redirect URLs (email links and Google)
- The Site URL is the default redirect and is "critical for email confirmations and password resets". Any `redirectTo` must match the Redirect URLs list.
- Wildcards: `*` matches any run of non-separator characters (the separators are `.` and `/`), and `**` matches anything.
- Examples from the docs: `http://localhost:3000/**` and `https://*-<team-or-account-slug>.vercel.app/**`. The docs add: "we recommend setting the exact redirect URL path for your site URL in production."
- Google setup:
  - Create a Google Cloud client of type "Web application".
  - **Authorized JavaScript origins:** the app's URL, plus `http://localhost:<port>` for development.
  - **Authorized redirect URIs:** the Supabase callback URL shown on the dashboard's Google provider page.
  - Enter the client ID and secret on that same page.
  - Scopes: `openid` plus email and profile.

### 2.6 Admin API (demo accounts)
- `auth.admin.createUser({ email, password, email_confirm: true, user_metadata })` creates an already-confirmed user.
- The docs say: "This function should only be called on a server." and "Never expose your `service_role` key in the browser."
- `app_metadata` isn't in the docs' examples. One issue reported admin calls failing with the new secret keys (supabase-js #1568, `bad_jwt`). It was closed as fixed on 28 Oct 2025. I'll confirm `app_metadata` works when you run the seed against your dev project.

### 2.7 Session storage in the browser
- `persistSession` "Defaults to true" and saves "the user session into local storage".
- `autoRefreshToken` and `detectSessionInUrl` default to true.
- `flowType` "defaults to implicit flow".
- The `storage` option is replaceable (D1).
- Refresh tokens "can only be used once", with a 10-second reuse interval. Any reuse outside that interval ends the session.

### 2.8 Two findings that shape the design
- **"Confirm email" is on by default for hosted projects.** If it is turned off, Supabase "implicitly confirms the user's email in the database", so `email_confirmed_at` gets set without anyone clicking a link. No claim in the token says that the email is verified: the JWT fields page lists none, and the user can write to `user_metadata`. A token therefore can't tell Relay whether an email was proven. What Relay *can* check is whether the project requires confirmation: `GET /auth/v1/settings` returns `mailer_autoconfirm` (see `settings.go` in supabase/auth). That check is D3.
- **Supabase's rate limits are per IP.** Sign-ups, `/recover`, `/resend`, `/otp` and `/user` share 30 requests per 5 minutes. The token endpoint (password sign-in and refresh) allows 150 per 5 minutes, and `/verify` allows 30 per 5 minutes. The backend must never call `/auth/v1/user` on each request, because every user would share Render's single IP and its budget of 30 per 5 minutes.

Sources:
[pricing](https://supabase.com/pricing) ·
[pausing](https://supabase.com/docs/guides/platform/free-project-pausing) ·
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp) ·
[rate limits](https://supabase.com/docs/guides/auth/rate-limits) ·
[signing keys blog](https://supabase.com/blog/jwt-signing-keys) ·
[signing keys](https://supabase.com/docs/guides/auth/signing-keys) ·
[JWTs](https://supabase.com/docs/guides/auth/jwts) ·
[JWT fields](https://supabase.com/docs/guides/auth/jwt-fields) ·
[sessions](https://supabase.com/docs/guides/auth/sessions) ·
[redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) ·
[Google](https://supabase.com/docs/guides/auth/social-login/auth-google) ·
[createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser) ·
[issue #1568](https://github.com/supabase/supabase-js/issues/1568) ·
[client options](https://jsr.io/@supabase/supabase-js@2.107.0/doc/~/SupabaseClientOptions.auth) ·
[initializing](https://supabase.com/docs/reference/javascript/initializing) ·
[general config](https://supabase.com/docs/guides/auth/general-configuration) ·
[passwords](https://supabase.com/docs/guides/auth/passwords) ·
[settings.go](https://github.com/supabase/auth/blob/master/internal/api/settings.go) ·
[database webhooks](https://supabase.com/docs/guides/database/webhooks) ·
[pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) ·
[managing user data](https://supabase.com/docs/guides/auth/managing-user-data) ·
[Gmail SMTP](https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app) ·
[app passwords](https://support.google.com/accounts/answer/185833) ·
[Gmail limits](https://support.google.com/mail/answer/22839) ·
[Gmail clients](https://support.google.com/mail/answer/7126229)

---

## 3. Inventory (0b): everything auth touches

### Backend: removed
| Area | Items |
|---|---|
| Routes | `POST /api/v1/auth/` `register`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password/:token` |
| Controllers | `auth.controller.js` (all but `me`), `password.controller.js` |
| Services (`services/auth/`) | `register`, `login`, `refresh`, `refreshToken`, `logout`, `lockout`, `token`, `forgotPassword`, `resetPassword` |
| Models | `RefreshToken`, `PasswordResetToken`. On `User`: `passwordHash`, `failedLoginAttempts`, `lockedUntil` |
| Utilities | `utils/passwords.js` (Argon2 and its concurrency queue), plus any of `utils/crypto.js` that only reset tokens use |
| Validators | `auth.validators.js` |
| Rate limits | `authLimiter`, `registrationLimiter`, `forgotPasswordLimiter`, and their constants |
| Config | `REFRESH_COOKIE_NAME` and `REFRESH_COOKIE_PATH`. The env vars `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. `cookie-parser` in `app.js` |
| Dependencies | `argon2`, `jsonwebtoken`, `cookie-parser` |
| Logging | The `reset-password` masking in `utils/logSafety.js` (the invite-token masking stays) |
| Email | The reset-password template (the invite template stays) |

### Backend: changed
| File | Change |
|---|---|
| `middleware/authenticate.js` | Verifies the Supabase identity and syncs the Relay user; still sets `req.userId` |
| `services/auth/me.service.js` | Adds `user.isDemo`; drops the `passwordHash` select |
| `services/invite/acceptInvite.service.js` | The invite email must match the identity's email, and that email must be proven |
| `models/User.js` | Adds `supabaseUserId` (unique, sparse) and `identityDeletedAt` |
| `config/envSchema.js` | Adds `AUTH_MODE`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_WEBHOOK_SECRET`, `AUTH_TEST_SECRET` |
| `services/member/deactivateMember.service.js` | Its transaction step is shared with the webhook's delete handling |
| `scripts/seed-demo.js`, `scripts/demo/{reset,writeWard,wardDocs}.js` | Demo identities live in Supabase; no more password hashing |
| `app.js`, `render.yaml`, `backend/.env.example` | Webhook route added; cookie parser and JWT secrets removed |

**Kept as is:**
- Every protected route still imports `authenticate`.
- Org-creation limit, invite limits, demo locks (`config/demo.js`).
- `apiLimiter`, `swapSearchLimiter`, helmet, CORS.
- Log redaction (the `Authorization` header is already redacted).

### Frontend
| Area | Files |
|---|---|
| Session plumbing | `lib/apiClient.js`, `lib/refreshHelper.js` (both rewritten). `lib/tokenStore.js` and `lib/tabSession.js` are removed, because D1's storage replaces them |
| Auth feature | `features/auth/{AuthProvider.jsx, AuthContext.js, useAuth.js, RequireAuth.jsx, RequireGuest.jsx}`; `api/passwordReset.js` is removed |
| Pages | `login/` (`useLoginAttempt`, `LoginForm`, `DemoAccounts`, `demoAccounts.js`), `register/useRegistration.js`, `forgotPassword/` (`NoEmailReset` removed, since Supabase always sends), `resetPassword/` (route `/reset-password/:token` becomes `/reset-password`), `acceptInvite/` (`AcceptInvitePage`, `InviteJoin`, `InviteWrongAccount`), new `AuthCallbackPage` |
| Elsewhere | `app/publicRoutes.jsx`, `AppLayout/UserMenu.jsx` (sign-out). `SidebarUserCard`, `OrgSwitcher`, `OrgProvider`, `RootRedirect` and the org selector only read the user, so they probably stay as they are |
| Config | `vercel.json` CSP and `app/vercelConfig.test.js`, `vite.config.js` (build guard), `frontend/.env.example` |
| New dependencies | `@supabase/supabase-js`, and `jose` (offline test mode only, never in the production bundle) |

### Tests
- **Backend:** 25 of the 137 test files sign in through `/auth/register` and `/auth/login`, and 6 create `User` documents directly. The shared helper is `tests/helpers/orgBuilder.js`.
  - All of these move to a `tokenFor()` helper that signs a test token. The first request then creates the Relay user, just as in production.
- **Deleted with the old endpoints** (`tests/auth/`): `accountLockout`, `accountLockoutReset`, `authFlow`, `authSession`, `emailDelivery` (reset emails), `forgotPassword`, `passwordQueue`, `passwords`, `register`, `resetLinkResend`, `resetPassword`, `resetPasswordRefusals`.
  - **Kept and adapted:** `inviteJoin`, `inviteRefusals`, `inviteEmailDelivery`, `organisations`.
- **Tenancy fuzzer:** its `PUBLIC` set loses the six auth routes and gains the webhook. The route count goes from **73 to 68**.
- **Frontend:** `DemoAccounts.test.jsx`, `ForgotPasswordPage.test.jsx`, and any others Phase 2 turns up.

### e2e
| File | Change |
|---|---|
| `support/session.js` | Unchanged: it still signs in through the login page, which signs a local token in test mode |
| `support/api.js` | Signs a test token in Node instead of calling `POST /auth/login` |
| `stack/environments.js`, `stack/startStack.js` | The backend gets `AUTH_MODE=test` and a random `AUTH_TEST_SECRET` for each run, replacing the two JWT secrets. The frontend build gets `VITE_AUTH_MODE=test` and the same secret, and runs with `--mode e2e` |
| `specs/03-every-page`, `specs/03-axe` | `PUBLIC_PAGES` gains `/reset-password` and `/auth/callback` |

### CI, scripts and docs
- `.github/workflows/nightly.yml`:
  - `reset-demo` gains the Supabase secrets.
  - A new keep-alive step is added.
  - `ci.yml` doesn't change; it stays offline.
- `scripts/smoke-deployed.mjs` and `scripts/smoke/sessionChecks.mjs`: sign in through Supabase's token endpoint; a refresh-and-`/auth/me` check replaces the refresh-cookie check.
- `docs/deploy/DEPLOY.md` and `README.md` are updated, and `docs/deploy/SUPABASE.md` is new.

---

## 4. Design

### 4.1 Backend identity layer
```
Authorization: Bearer <Supabase access token>
  -> authenticate
       resolveIdentity(req)  -> { externalId, email, name, emailProven }
       syncUser(identity)    -> the Relay user (find, link or create)
       req.userId = user._id; req.identity = identity
  -> every existing route, unchanged
```
The new files live in `services/identity/`, each under 100 lines:
- **`adapters.js`** picks the adapter from `AUTH_MODE`: `supabase` (the default) or `test`.
- **`supabaseAdapter.js`** verifies tokens:
  - jose `jwtVerify` with `createRemoteJWKSet`. Keys are cached for 10 minutes, an unknown `kid` triggers a refetch after a 30-second cooldown, and fetches time out after 5 seconds.
  - **Only `ES256` and `RS256` are accepted.** `none`, `HS256` and anything else are refused.
  - The issuer must be `${SUPABASE_URL}/auth/v1` and the audience `authenticated`.
  - `sub` and `exp` are required, with a 5-second clock tolerance.
- **`testAdapter.js`** verifies HS256 tokens signed with `AUTH_TEST_SECRET`. It refuses to run unless `NODE_ENV=test`.
- **`claims.js`** turns claims into an identity:
  - `role` must be `authenticated`.
  - Anonymous users are refused.
  - `email` is required and lowercased.
  - The name comes from `user_metadata.name`, then `full_name`, then the email's local part. It is trimmed and capped at 80 characters, because `user_metadata` is input from the user.
- **`emailTrust.js`** answers `emailsAreProven()`:
  - It sends `GET ${SUPABASE_URL}/auth/v1/settings` with the publishable key.
  - It returns true only when `mailer_autoconfirm === false`.
  - The answer is cached for 10 minutes, and any failure counts as false.
  - The test adapter reads an `email_verified` claim instead, which only test tokens carry.
- **`syncUser.service.js`** and **`linkRules.js`** implement §4.2.
- **`deleteIdentity.service.js`** handles the webhook's delete events (§4.3).

**The server refuses to start** in these cases, checked by `envSchema` and tested:
- `AUTH_MODE=test` with any `NODE_ENV` other than `test`.
- `AUTH_MODE=supabase` without `SUPABASE_URL`.
- A `SUPABASE_URL` that isn't https (http is allowed only for localhost).

| Case | Status | `error.code` |
|---|---|---|
| Missing, malformed or expired token; wrong `iss`, `aud` or `alg`; unknown key; anonymous user; no email; deleted identity | 401 | `UNAUTHORIZED` |
| JWKS unreachable | 503 | `AUTH_UNAVAILABLE` (new). The client doesn't sign anyone out over a Supabase hiccup |
| Linking an existing account while emails aren't proven | 403 | `EMAIL_NOT_PROVEN` (new) |
| The email belongs to a Relay user linked to a different live identity | 409 | `CONFLICT` |

### 4.2 JIT sync and linking
For a verified identity, the backend checks these cases in order:

1. **A Relay user with this `supabaseUserId` exists.** Use that user.
   - If the identity was deleted (`identityDeletedAt` is set), return 401.
   - If the email has changed, copy the new email only when emails are proven, the address is free and the user isn't a demo account. Otherwise keep the old email and log a warning.
2. **A Relay user with this email exists.**
   - If that user has no `supabaseUserId` (an account from before the switch) or its identity was deleted, link it. Linking happens only when emails are proven; otherwise return 403 `EMAIL_NOT_PROVEN`.
   - If that user is linked to another live identity, return 409. This happens if two Supabase projects share one MongoDB database, so **each project gets its own database**: dev project with your dev database, prod project with the deployed one.
3. **No match.** Create `{ name, email, supabaseUserId }`.

Concurrency:
- `supabaseUserId` has a unique sparse index.
- Linking is a single conditional `findOneAndUpdate`.
- Creating catches duplicate-key errors and runs the lookup once more.
- A test sends 10 parallel first requests with one new token and expects exactly one user and ten 200 responses.

Demo users keep their fixed ids, so `isDemoUser` keeps working.

### 4.3 Webhook (you choose whether to configure it)
`POST /api/v1/webhooks/supabase-auth` exists only when `SUPABASE_WEBHOOK_SECRET` is set; otherwise it returns 404.

**Request:**
- Header `Authorization: Bearer <secret>`. The secret is compared in constant time: SHA-256 on both sides, then `timingSafeEqual`.
- Body: `{ type: 'UPDATE' | 'DELETE', record: { id, email } | null, old_record: { id, email } }`.
- The endpoint is rate-limited, accepts only a small JSON body, and never logs the body.

**Handling:**
- **UPDATE** copies the email, using the same rules as JIT sync.
- **DELETE** sets `identityDeletedAt`. It then makes every active membership inactive, using the same steps as a manager's Deactivate: draft shifts become unfilled slots, published history stays, and the fairness ledger refreshes.
  - The **last active owner** of an organisation stays active, because the existing rule says every organisation keeps an owner. The webhook logs it. That person can sign up again with the same email and get the account back.
- An unknown id or a repeated event returns 204 and changes nothing.

**Supabase side** (in the docs; you set it up):
- Enable `pg_net`.
- Add a trigger function on `auth.users` that sends only `id` and `email`. A Database Webhook on that table would send the whole row, password hash included.
- Wrap the call so that a failure can never block a sign-in, and give it a 30-second timeout.

pg_net requests are asynchronous and aren't retried, and the Render free instance may be asleep, so delivery is best effort. Without the webhook:
- Email changes still sync on the user's next request.
- A deleted user loses access when their access token expires, within an hour.
- A manager can deactivate them by hand.

### 4.4 Hardening, before and after
| Today | After the migration |
|---|---|
| Argon2id hashing with a concurrency cap | Removed: Supabase stores the passwords |
| Per-account lockout | Removed, as the prompt says. Supabase's per-IP limits replace it. Supabase CAPTCHA is possible later (it needs a CSP change) |
| Relay HS256 access JWT plus a rotating httpOnly refresh cookie | A Supabase ES256/RS256 JWT verified locally, with the session in `sessionStorage` (D1) |
| Relay's auth, registration and forgot-password limiters | Supabase's per-IP limits, documented in DEPLOY.md |
| Reset tokens masked in logs | No reset token ever reaches Relay |
| Org-creation limit, invite limits, demo locks, `apiLimiter`, helmet, CORS, CSP, log redaction | Unchanged, except that the CSP's `connect-src` gains the production Supabase origin and nothing else |

New protections: the constant-time webhook secret check, and both the server and the frontend build refuse test auth in production.

### 4.5 Frontend
- **`lib/supabaseClient.js`** calls `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)` with these auth options: `storage: sessionStorage`, `flowType: 'implicit'`, and session persistence, auto-refresh and URL detection on.
- **`features/auth/authClient.js`** is one small interface: `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `sendPasswordReset`, `updatePassword`, `accessToken`, `refresh`, `onChange`. It has two implementations:
  - **Supabase**, used normally.
  - **An offline test client**, used when `VITE_AUTH_MODE=test`. It signs HS256 tokens with `VITE_AUTH_TEST_SECRET` and accepts only the shared test password. It is loaded by a dynamic import inside a branch that Vite removes from production builds.
- **`AuthProvider`** gets the session from the auth client, then calls `GET /auth/me`; on a new identity's first call, that creates the Relay user.
  - Sign-out uses `scope: 'local'`. Supabase's default, `'global'`, would sign out every visitor using a shared demo account at once.
- **`apiClient`**:
  - Sends `Authorization: Bearer` with the token from the auth client.
  - On a 401, it refreshes once (a single refresh shared by all waiting requests) and retries. This now includes `/auth/me`.
  - If it still gets a 401, it signs out locally and goes to `/login`.
  - A 503 `AUTH_UNAVAILABLE` shows an error and doesn't sign anyone out.
- **Pages:**
  - **Login:** email and password, "Continue with Google", and the demo buttons when `VITE_DEMO_MODE=true`.
  - **Register:** after submitting, shows "Check your email".
  - **Forgot password:** always answers "If an account exists, we've sent a link".
  - **`/reset-password`:** the recovery link provides a session; the page asks for a new password and calls `updateUser`.
  - **`/auth/callback`:** waits for the session, then goes to `next`, or shows the link's error (for example, an expired link).
- **The Google button** needs Google's four brand colours. They go into one `brand-google-*` token set in `index.css`, so components still use only tokens.
- **Invites keep today's flow.**
  - Register pre-fills the invited email.
  - The confirmation link carries `next`, so the user comes back to the invite.
  - If the signed-in email differs from the invite's, the wrong-account page appears.
- **CSP:** `connect-src 'self' https://<prod-ref>.supabase.co`, which allows the production project only. Vercel previews also use the production project, and the dev project is for localhost.
- **Build guard** (in `vite.config.js`, logic in `build/envGuard.js`, with a unit test):
  - **Any build** refuses a `VITE_` variable whose name contains `SERVICE_ROLE`, or whose value is a secret key (`sb_secret_…` or a JWT with role `service_role`).
  - **A production build** also refuses `VITE_AUTH_MODE=test` and `VITE_AUTH_TEST_SECRET`. A build counts as production when its mode is `production` or it runs on Vercel.

### 4.6 Demo accounts
- `seed:demo` runs locally or in the nightly job, with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. For each demo email (a fixed list, all `@relay.test`):
  - If the Supabase user is missing, it creates it with `email_confirm: true`, the public demo password and `app_metadata.relay_demo = true`.
  - If the user exists, it resets the password.
- It then writes the Mongo ward with each user's `supabaseUserId` and the users' fixed ids.
- **It refuses to touch any user that isn't on the list, isn't on the `.test` domain, or lacks the marker.** A test checks this against a fake Admin API.
- **The service role key is only ever in your local `backend/.env` (gitignored) and a GitHub Actions secret.** It never goes on Render, never in a `VITE_` variable and never in a committed file. The admin client lives in its own module, which only the CLI imports.
- e2e and the other in-memory runs use no Supabase at all. Demo users get linked by email on their first test sign-in.

### 4.7 Nightly workflow
- `reset-demo` gains the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. Until they're set, it skips with a notice, as it does today.
- A `keep-alive` step calls `auth.admin.listUsers({ perPage: 1 })` with the same secrets. It doesn't depend on the demo reset, so it still runs when `DEMO_MONGODB_URI` isn't set.

### 4.8 Local development and cutover
- **Pairing:** the dev Supabase project goes with your dev database, and the prod project with the deployed one (§4.2).
- **No offline mode for `npm run dev`:** offline test auth works only when `NODE_ENV=test`, so `npm run dev` always talks to your dev project.
- **Cutover:**
  1. Set the Render and Vercel env vars **before** deploying. The backend refuses to start without `SUPABASE_URL`.
  2. Deploy the backend and the frontend together.
  3. Run the nightly workflow once by hand, so the demo users exist in Supabase.
  4. Existing users choose "Create account" with the same email, confirm it, and land in their old account with their memberships intact.
  5. Run the D5 cleanup when you're ready.

---

## 5. API contract

### 5.1 Authentication
Every protected endpoint takes `Authorization: Bearer <Supabase access token>`. Errors keep today's shape, `{ error: { code, message } }`, and their statuses are listed in §4.1.

### 5.2 Endpoints
| Change | Endpoint | Details |
|---|---|---|
| Removed (return 404) | `POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password/:token` | Supabase replaces them |
| Kept | `GET /api/v1/auth/me` | Same response, plus `user.isDemo`. On a new identity's first call, it creates the Relay user |
| Changed | `POST /api/v1/orgs/invites/:token/accept` | Also returns 403 `EMAIL_NOT_PROVEN` when the project doesn't require email confirmation. The email-match rule is unchanged |
| Added | `POST /api/v1/webhooks/supabase-auth` | Returns 204, 400, 401, or 404 when disabled (§4.3) |
| Unchanged, public | `GET /api/health`, `/api/v1/health`, `/api/v1/config`, `/api/v1/invites/:token` | |

`GET /api/v1/auth/me` returns 200 with this body:
```json
{
  "user": { "id": "…", "email": "…", "name": "…", "isDemo": false },
  "memberships": [{ "orgId": "…", "orgName": "…", "orgTimezone": "…", "role": "…", "qualificationIds": [], "isDemo": false }]
}
```

### 5.3 Data
- **`User`** gains `supabaseUserId` (a string with a unique sparse index) and `identityDeletedAt` (a date). It loses `passwordHash`, `failedLoginAttempts` and `lockedUntil`. Mongoose stops reading those fields, and the D5 script removes them.
- **`refreshtokens` and `passwordresettokens`** are no longer used, and the D5 script drops them.

### 5.4 Environment variables
| Variable | Where | Secret? | Notes |
|---|---|---|---|
| `SUPABASE_URL` | Render, local `backend/.env` | No | |
| `SUPABASE_PUBLISHABLE_KEY` | Render, local `backend/.env` | No (public) | Used for the settings check. The legacy anon key is accepted too |
| `SUPABASE_WEBHOOK_SECRET` | Render, and the trigger | **Yes** | Optional |
| `AUTH_MODE`, `AUTH_TEST_SECRET` | Test runs only | Random per run | `test` is refused unless `NODE_ENV=test` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel, local `frontend/.env.local` | No | |
| `VITE_AUTH_MODE`, `VITE_AUTH_TEST_SECRET` | The e2e build only | n/a | Refused in production builds |
| `SUPABASE_SERVICE_ROLE_KEY` | GitHub Actions secret, local `backend/.env` | **Yes** | For the seed and keep-alive only. A secret key (`sb_secret_…`) is accepted too. Never on Render or Vercel |
| Removed: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Render, local | | Delete them from Render after the switch |

---

## 6. Tests and verification
- **New backend tests** (Vitest with mongodb-memory-server, all offline):
  - Supabase adapter, using a key pair generated in the test and a local JWKS: valid token; wrong `iss`, `aud` or `exp`; `alg: none`; an HS256 token forged with the public key; unknown `kid`; JWKS unreachable returns 503.
  - Test adapter, and the server refusing to start with `AUTH_MODE=test` in production.
  - JIT sync: create; link when the email is proven; refuse when it isn't; 409; email copied; email conflict; demo email never changed; concurrency.
  - `emailTrust`, with a mocked `fetch`.
  - Webhook: bad secret, disabled, update, delete (memberships inactive, history kept, last owner kept), idempotent repeat, old token refused after a delete, signing up again relinks.
  - `/auth/me` returns `isDemo`.
  - Demo seed against a fake Admin API, including its refusals.
  - D5 script: dry run, then apply.
- **Existing suites:** every test that signs in moves to `tokenFor()`. The tenancy fuzzer must cover 68 routes, and the engine boundary proof must still fire.
- **Frontend:**
  - The auth client.
  - `apiClient` refreshing once and retrying.
  - `envGuard`.
  - The CSP test.
  - The auth pages.
- **e2e:** the full suite runs on offline test auth under the production CSP.
- **What I run:** `npm test`, `npm run lint`, `npm run build`, `npm run e2e`, `npm run scan:secrets`, plus my diff secret scans. I also check that the production bundle contains no test-client code. I run no dev server, no Supabase call and no live MongoDB.
- **What you test locally** with your dev project (DEPLOY.md and SUPABASE.md will give the steps):
  1. Sign up, confirm the email and land in the app.
  2. Your old account links to the new identity.
  3. Google sign-in.
  4. Forgot and reset password.
  5. An invite for the right email and one for the wrong email.
  6. The demo buttons, after `seed:demo` has run against the dev project.

## 7. Commits on `supabase-auth`
1. Add the Supabase identity layer to the backend: the identity services, the new `authenticate`, `User.supabaseUserId`, the webhook, env checks and migrated test helpers.
2. Move the frontend to Supabase Auth, with offline test auth for e2e.
3. Remove the old auth: endpoints, services, models, lockout, Argon2, dependencies, old tests and limiters.
4. Keep demo accounts in Supabase, and add the nightly keep-alive and the cleanup script.
5. Docs: `SUPABASE.md`, DEPLOY.md and the README.

Every commit passes lint, tests and build, and e2e passes from commit 2 on. The secret scans run before each commit. Then `git push -u origin supabase-auth`: never `main`, never a force-push.

## 8. Values I need from you
- **Before Phase 2 is finished:** the production project's ref, for the CSP. It isn't secret.
- **Nothing secret, ever.** Project URLs and publishable keys go in your env files. The service role key goes only in your local `backend/.env` and in GitHub secrets.

## 9. Known gaps after the migration
- The refresh token can be read by scripts running in the page (D1).
- The per-account lockout is gone; Supabase's per-IP limits remain.
- Anyone signed in as a demo account could change its password directly through Supabase's API. The nightly reset puts it back.
- Webhook delivery is best effort (§4.3).
- Free projects pause after 7 days without activity. Whether Supabase counts Auth traffic as activity isn't stated in its docs (D4).
- Gmail needs 2-Step Verification for an app password, has a limit of about 500 emails a day, and Google discourages app passwords.
- A duplicated browser tab copies `sessionStorage`. The two tabs then share one refresh token and can sign each other out at the next refresh (reuse detection). This should be rare.
- With the implicit flow, a crafted link can sign a tab into someone else's account. In Relay the impact is low, and the user's name always shows in the sidebar.

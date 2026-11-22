# Final pre-release audit

**Date:** 22 Nov 2026. **Commit audited:** `725485f` on `main`.
**How:** everything ran locally and offline - unit tests, the in-memory database and the e2e environment with the offline test sign-in. Nothing was sent to the live site, any deployed service, the live database or Supabase.

**Phase 1 (this document):** the audit, plus tests that only *prove* an error path already works. Nothing in the app was changed. **Phase 2:** only the fixes approved below, each with a test.

Each finding gives the file and line, what is wrong, the proposed fix, and the risk of changing it.

---

## Must fix

A bug, a security issue, or a false statement in the README.

| # | Where | What is wrong | Proposed fix | Risk of the fix |
| --- | --- | --- | --- | --- |
| M1 | `backend/src/services/roster/generateRoster.service.js:28-40` | **Two generations can start at once.** The "one run per organisation" check reads, then creates: two requests arriving together both find no running job, both pass `hasCapacity()` (the counter only rises once a worker starts), and both create a job. Reproduced locally 5 times out of 5: both answered 202 and two jobs were created. The UI's button cannot be double-clicked (proved below), but two tabs, two managers or a script can - and two workers on Render's 512 MB, writing the same roster, is what the limit exists to prevent. | Make the claim atomic: a partial unique index on `GenerationJob` (`orgId`, for `queued` and `running` only), with a duplicate-key error answered as the existing 409 "already running". Test: two requests at once give one 202, one 409, one job. | Low. Must land together with M2, or a job orphaned by a restart would block the index's organisation for good. |
| M2 | `backend/src/services/roster/generationJob.js` (header), `generateRoster.service.js:28` | **A restart mid-generation blocks that organisation forever.** A failure inside the worker is recorded, but if the process stops (a deploy, an out-of-memory restart), its job stays `running`. The in-flight check has no age limit, so every later attempt is refused with "A generation is already running" - the code's own header names the danger. `backend/tests/roster/generationRefusals.test.js` shows the mechanism: a job left `running` refuses every new run. The demo recovers each night (its reset deletes jobs); any other organisation would not. | On server start, mark every `queued` or `running` job failed ("The server restarted while this roster was being generated. Try again."): one instance runs every worker in-process, so none can still be alive. Also ignore jobs older than the run's deadline plus grace in the in-flight check. Test: a job left `running` from before a restart no longer blocks a new run. | Low. Relies on one server instance, which the free plan is; noted in the code. |
| M3 | `npm audit --omit=dev` | **Runtime dependency advisories with non-breaking fixes.** `body-parser` < 1.20.9 (high: denial of service via trailing bytes - reachable, every JSON request is parsed); `mongoose` 8.24.4 (high: several, fixed in 8.24.7); `nodemailer` 10.0.16 (moderate: address parsing - only when email is enabled, which it is not on the live site); `qs` 6.16.0 (moderate: `stringify` with comma arrays - not reachable, Express only parses). | `npm audit fix` (stays within the existing major versions), then the full test and e2e run. | Low: patch and minor updates only. |
| M4 | `README.md:223` | **"reseeds at 03:00 IST once Relay is deployed"** - Relay is deployed, so this reads as if it were not. | "reseeds every night at 03:00 IST". | None. |
| M5 | `README.md:210, 218` | **Test counts are now behind.** The proof tests added with this report change them: see the baseline below. | Update the counts once Phase 2 is done, from that run. | None. |

## Should fix

Dead code, stale docs, small UX.

| # | Where | What is wrong | Proposed fix | Risk of the fix |
| --- | --- | --- | --- | --- |
| S1 | `backend/src/config/swaps.js:25-27`, `backend/src/engine/scheduling/eligibility.js:88-95`, `backend/src/jobs/runGeneration.js:29-31`, `backend/src/middleware/requestContext.js:5, 9, 22, 25-27` | **Dead code.** `NOTIFICATION_LIST_LIMIT` (its comment still says the notification centre is "Milestone 9"), `isAllowed`, `activeGenerationCount` and `getRequestContext` are used nowhere - and the `AsyncLocalStorage` store exists only for `getRequestContext`, so nothing ever reads it. | Remove them; keep the request id itself (header, logs, error bodies). | None: nothing calls them. |
| S2 | `frontend/package.json:17, 24, 26-28` | **Unused frontend dependencies:** `react-hook-form`, `@hookform/resolvers`, `zod`, `zustand` and `recharts` are imported nowhere in the frontend. They are not in the bundle, but they are installed and audited. | `npm uninstall -w frontend` them. | Low: the build and the tests show nothing needed them. |
| S3 | `frontend/src/components/ui/index.js`, `frontend/src/components/ui/toast/index.js` | **Unused barrel files.** Nothing imports them; every page imports components directly. | Delete both. | None. |
| S4 | `backend/scripts/cleanup-legacy-auth.js`, `backend/scripts/cleanup/`, `backend/tests/scripts/cleanupLegacyAuth.test.js`, `backend/package.json:20` | **The legacy-auth cleanup has done its job.** It has been run on the live database, and nothing else will ever need it. **Recommendation: remove it** (script, helpers, test and npm script), and say in `docs/deploy/SUPABASE.md` (line 199) that the cleanup was run, naming the commit that last had the script. Keeping it as a documented one-time step would also be defensible, but it adds code and tests for a step no one will repeat. | Remove, as above. | Low: no running code uses it; git history keeps it. |
| S5 | `backend/src/models/User.js:7-10` | **Stale comment:** old password fields "may still" be in the database and `npm run cleanup:legacy-auth` removes them - both no longer true. | Say the cleanup has been run, and drop the script name. | None. |
| S6 | Branches `supabase-auth` (local and `origin`) | **Fully merged** into `main`: 0 commits on either that `main` lacks. | Delete both: `git branch -d supabase-auth` and `git push origin --delete supabase-auth`. Not done yet, as asked. | None: everything on them is on `main`. |
| S7 | `AGENTS.md:23-29, 32-38, 48` | **Out of date after the migration.** It never mentions Supabase, so it does not forbid calls to a real Supabase project; `npm run e2e` (offline, in-memory) and `npm run scan:secrets` are missing from the approved actions; and "Frontend API calls always go through `src/lib/apiClient.js`" is true of Relay's API only - sign-in goes through `frontend/src/lib/auth/`. | Add the Supabase rule and the two commands; reword the API-calls line. | None. |
| S8 | `backend/src/errors/AppError.js`, `backend/src/middleware/validate.js`, `backend/src/routes/health.routes.js`, `backend/src/server.js`, `backend/src/utils/logger.js` | **No header comment**, which `AGENTS.md` asks of every file - the only five source files without one. | Add a one-paragraph header to each. | None. |
| S9 | `backend/src/services/email/transport.js:70, 80, 84, 89`, `backend/src/services/email/email.service.js:32` | **Recipient email addresses are logged in plain text** when email is enabled. The live API sends no email, so its logs hold none and the privacy page is accurate today; but any deployment with email turned on would log addresses, where the privacy page says warnings name accounts by ID. | Log a masked address (`w***@example.com`), or none. | Low. |
| S10 | `frontend/src/lib/apiError.js:48` | **Developer wording shown to visitors:** a 5xx with no JSON body (for example Vercel unable to reach Render) reads "Cannot reach the Relay API. Is the backend running?". | "Relay's server is not answering. Try again in a moment." | Low; update any test that pins the old words. |
| S11 | `frontend/src/pages/routeError/RouteErrorPage.jsx:21`, `frontend/src/lib/queryClient.js` | **Offline mid-session is handled, but not well.** In a real browser, going offline and opening a page whose code was not loaded yet shows the route error page with the raw "Failed to fetch dynamically imported module: http://.../assets/index-....js", and it stays there after the connection returns until Try again is pressed. And by its default (`networkMode: 'online'`), TanStack Query pauses requests while the browser is offline instead of failing them, so data asked for then waits without a word. Nothing ever says "you are offline". | A small banner driven by the browser's `online`/`offline` events ("You are offline. Relay will catch up when you are back."); on the route error page, plain words for a page that could not load, without the raw text, and a reload once back online. Test: an e2e spec with `context.setOffline()`. | Low. |
| S12 | `frontend/index.html` | **No Open Graph or Twitter tags**, so a shared link to `relay-fs.vercel.app` shows no proper card or image. The title, description and favicon are there. | Add `og:title`, `og:description`, `og:url`, `og:image`, `og:type` and `twitter:card` (`summary_large_image`). For the image: a 1200x630 PNG cropped from a real screenshot of the demo - the Swaps page with the three-person chain diagram, as in `docs/media/swap-chain.gif` - served from `frontend/public/og-image.png` with an absolute URL. | None. |
| S13 | `npm audit` (development only) | **Dev-only advisories with non-breaking fixes:** `follow-redirects`, `nodemon` (through `minimatch`), and `vite` 6.4.3 (6.4.6 is out, same major). | `npm audit fix`; `npm install -w frontend vite@6.4.6`. | Low. |

## Leave

| # | What | Why it is left |
| --- | --- | --- |
| L1 | `zod` < 4.6.6 (high: memory exhaustion validating oversized collections) | The only fix is the breaking move to Zod 4. Request bodies are capped at 100 kB (`JSON_BODY_LIMIT`), which bounds the collections Zod ever sees. Plan the migration after release. |
| L2 | Vitest 2.1.9 and its chain: `tinypool` (critical), `vitest` (critical, its UI server), `@vitest/mocker`, `vite-node`, `esbuild` | Development only: none of it ships, and nothing here runs the Vitest UI or exposes a dev server. **The parked Vitest major upgrade is still needed** to clear them (the fix is Vitest 5) - but as a change of its own, not part of this release. |
| L3 | `qs` advisory | Covered by M3's update anyway; on its own it is unreachable (`stringify` with comma arrays is never used). |
| L4 | About 30 exports used only inside their own file (for example `toOffer` in `loadSwapSearch.service.js`) | Harmless: the functions are used; only the `export` is unnecessary. |
| L5 | Prettier and `prettier-plugin-tailwindcss` (no npm script runs them) | Used by editors through the root `.prettierrc`. A `format` script could be added; nothing is wrong. |
| L6 | `backend/src/engine/swaps/types.js` (reached by no import) | JSDoc type definitions only, for editors - no runtime code. |
| L7 | `console.error` in `backend/src/config/env.js:12` | Runs at start-up on invalid settings, before the logger exists. Correct. |
| L8 | `password` and `passwordHash` in the logger's redaction list (`backend/src/utils/logger.js`) | Left from the old sign-in; harmless defence in depth. |
| L9 | Client IP addresses in request logs, unmasked | Documented in the README's Known gaps and on the privacy page. |
| L10 | No request timeout on the Supabase client (`frontend/src/lib/auth/supabaseAuthClient.js:23`) | An unreachable Supabase fails at once with a clear message (proved below). Only a connection that hangs silently would leave the spinner until the browser gives up - rare. |
| L11 | No source maps in the production build | Vite's default; intended. Nothing in the code needs hiding, but nothing needs them either. |
| L12 | The demo password in the built JavaScript | By design, for the demo buttons, and documented in the README. |

---

## 1. Leftovers

- **Old sign-in packages:** none remain - no `argon2`, `cookie-parser`, `bcrypt` or `jsonwebtoken` in any `package.json`; `jose` does the token checks.
- **Unused code:** `npx knip` and `npx depcheck` could not be run - this session's permission policy refuses downloading and running a package through `npx`. Instead a read-only scanner (kept outside the repo) traced imports from every entry point - the server, the generation worker, scripts, tests, configs, e2e specs and the e2e stack's child processes - and listed unreachable files, unimported dependencies and exports nothing else mentions. Every hit was confirmed by reading the code: S1, S2, S3, L4 to L6. One false positive (`e2e/stack/expireChain.js`, started as a child process) was ruled out.
- **Environment variables:** all 19 in `backend/.env.example`, all 4 in `frontend/.env.example` and all 11 keys in `render.yaml` are read by the code. None is left from the old sign-in.
- **`TODO`, `FIXME`, stray `console.log`, commented-out code:** none.
- **`frontend/public/`:** only `favicon.svg`, used by `index.html`.
- **The cleanup script and the `supabase-auth` branch:** S4 and S6.
- **`AGENTS.md`:** S7.

## 2. Dependencies and security

**`npm audit`, 22 Nov 2026:** production 5 (2 moderate, 3 high); including development 14 (7 moderate, 5 high, 2 critical); the e2e package 0. Every finding is in M3, S13, L1, L2 or L3.

**The built frontend** (production build, demo mode as deployed) holds no `service_role` key, no `sb_secret_` key, no MongoDB address, no `JWT_` setting and no private key. The strings `sb_secret_`, `localhost` and `127.0.0.1` appear only inside libraries: supabase-js checking a key's prefix and listing local hosts, and React Router's fallback base URL. The demo password is there by design (L12). No source maps are published (L11).

**Error responses in production** never carry a stack trace or internal details: a 5xx says only "Internal server error", a duplicate key does not echo its values, and a malformed id does not name its field - pinned by `backend/tests/security/productionErrors.test.js`, which runs with `NODE_ENV=production`.

**Logs:** each request is logged as its id, method, URL with any invite token masked, address and status - no headers, so no access tokens, and no bodies (`backend/src/utils/logSafety.js`, `backend/tests/security/logSafety.test.js`). The Supabase sign-in code logs user and organisation ids only. Addresses are not masked (L9). Email addresses: S9.

**Secret scan** over the full history: nothing in 76 commits, and no environment file tracked.

## 3. Error paths

| Path | Works? | Proof |
| --- | --- | --- |
| API unreachable | Yes | **New** `e2e/specs/03-api-unreachable.spec.js`: a page says "Cannot reach the Relay API." with Try again - never blank - and Try again brings it back once the API answers. **New** `frontend/src/lib/apiClient.failures.test.js`: a network failure is one clear error. `frontend/src/lib/slowRequests.test.js`: "Starting the server" after 3 s of waiting. |
| Supabase unreachable at sign-in | Yes | **New** `frontend/src/lib/auth/authErrors.test.js` and `frontend/src/pages/auth/login/useLoginAttempt.test.jsx`: "Cannot reach the sign-in service. Check your connection and try again.", and the spinner stops. |
| Token expired, or over the 7-day limit | Yes | `e2e/specs/03-session-age.spec.js`, `frontend/src/lib/auth/sessionAge.test.js`, `frontend/src/lib/apiClient.test.js` (`SESSION_EXPIRED` ends the session without a refresh). |
| A 401: one refresh, one retry, never a loop | Yes | `frontend/src/lib/apiClient.test.js`; **new** `apiClient.failures.test.js`: a 401 that survives the refresh is not tried again. |
| Unknown route; a crash while rendering | Yes | **New** `frontend/src/app/routeErrors.test.jsx`: the 404 page, the route error page with Try again, and every route in the app's router under an `errorElement`. |
| Double-clicking Generate, Propose, Accept, Approve | Yes, in the browser | **New** `GenerationPanel.test.jsx`, `ProposeDialog.test.jsx`, `swapButtons.test.jsx`: one request each, the second click 20 ms after the first. On the server: `backend/tests/swapChains/chainRaces.test.js` and **new** `doubleSubmit.test.js` (one person's Accept sent twice at once records one acceptance). **But two generate requests at the same moment start two runs: M1.** |
| Offline mid-session | Partly | S11. |
| Bad input on every write route | Yes | **New** `backend/tests/security/badInput.test.js`: all 40 POST, PUT, PATCH and DELETE routes, read from the router, with malformed ids, missing fields, wrong types, a list for a body, unparseable JSON and a body over 100 kB - always a 4xx in the API's error shape, never a 500; the oversized body gets 413. |
| Database down or slow | Yes | **New** `backend/tests/health/databaseDown.test.js`: the health check answers 503 at once, and a request that needs the database gets a 500 promptly instead of hanging. A server that stops answering is given up on after 10 s (`serverSelectionTimeoutMS`). |
| Two people approving or accepting at once | Yes | `backend/tests/swapChains/chainRaces.test.js`: two final acceptances commit once; a duplicate approval commits once and both succeed. Runs with the test identity adapter, so the guarantees hold after the move to Supabase. |
| A token for someone whose membership was deactivated | Yes | `backend/tests/members/memberDeactivate.test.js`: their token gets 404 for the organisation, and `/auth/me` lists no memberships. |
| Rate limits on organisations and invites | Yes | `backend/tests/limits/orgLimits.test.js`: five organisations per account, ever; 20 invites a day per organisation. |

## 4. What a reviewer sees first

**README:** checked against the code and the runs - the versions in "Built with", the limits, the 68 routes the tenancy fuzzer covers, the nightly job at 03:00 IST (21:30 UTC), the 90-day notification expiry, the CI steps, and the live performance numbers. All match except M4 and M5. Every relative link, anchor and image path resolves. No doubled words were found.

**The page head:** a title ("Rosters that follow your rules - Relay"), a meta description, an SVG favicon and a theme colour are there; social cards are not (S12).

**Lighthouse: not run.** `npx lighthouse` downloads and runs a package, which this session's permission policy refuses. To run it: `VITE_DEMO_MODE=true npm run build -w frontend`, then `npm run preview -w frontend -- --port 4173`, then `npx lighthouse http://localhost:4173/ --preset=desktop --view` and the same without `--preset` for mobile, and again for `/login`. Allow `npx` and it can be done in Phase 2.

**Bundle:** the entry chunk is 344 kB (110 kB gzipped): React, React Router, TanStack Query and the app shell. supabase-js is 229 kB (60 kB gzipped) in a chunk of its own, loaded only when a session may exist - a first-time visitor to the landing page never downloads it. Luxon is 71 kB (22 kB gzipped), shared by the pages that need dates. The CSS is 47 kB (10 kB gzipped). Every page is already its own lazy chunk (79 files). Nothing large is left to lazy-load.

## 5. Baseline

Run on 22 Nov 2026, with this report's proof tests included:

| Command | Result |
| --- | --- |
| `npm test` | Backend **640 tests in 146 files**, frontend **167 tests in 46 files** - all passed. (The README still says 634 in 143 and 152 in 39: M5.) |
| `npm run lint` | Clean in both workspaces. |
| `npm run build` | Built. |
| `npm run e2e` | **64 tests in 24 spec files**, all passed, in 6.7 minutes. axe: 40 page-and-theme checks, **0 issues at any severity**. (The README says 63 in 23: M5.) |

## Proof-only tests added with this report

- Backend: `backend/tests/security/badInput.test.js`, `backend/tests/health/databaseDown.test.js`, `backend/tests/swapChains/doubleSubmit.test.js`.
- Frontend: `frontend/src/lib/apiClient.failures.test.js`, `frontend/src/lib/auth/authErrors.test.js`, `frontend/src/pages/auth/login/useLoginAttempt.test.jsx`, `frontend/src/app/routeErrors.test.jsx`, `frontend/src/pages/schedule/generation/GenerationPanel.test.jsx`, `frontend/src/pages/swaps/ProposeDialog.test.jsx`, `frontend/src/pages/swaps/swapButtons.test.jsx`.
- End to end: `e2e/specs/03-api-unreachable.spec.js`.

Each passes against the code as it is; none changes behaviour.

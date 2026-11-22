# Rules for AI Coding Agents Working on Relay

Any AI agent (Claude Code, Cursor, etc.) working on this project MUST read and follow these rules.

## Testing rules

**NEVER run curl, wget, httpie, fetch, or any HTTP request against a running backend** — not localhost, not staging, not production.

**NEVER connect to the live MongoDB database** from a script or shell unless the user explicitly asks for that specific task.

**NEVER create test users, test organisations, or any other test data in the real database** as part of a "verification" step.

**NEVER call a real Supabase project** — not its Auth API, not its Admin API — from a script, a shell or a test, unless the user explicitly asks for that specific task. Tests and the e2e run sign in offline with the test identity (`AUTH_MODE=test`, `VITE_AUTH_MODE=test`) and never reach Supabase.

If a prompt asks you to verify or test changes:
- Write the code
- Write unit/integration tests that use `mongodb-memory-server`
- Describe the commands the USER should run manually
- Do NOT execute those commands yourself

## Why this matters

The dev database is shared and real. Earlier in this project, verification steps created nine junk users in the live Atlas cluster. Test data pollutes the database, wastes free-tier storage, and makes real testing confusing. The user tests manually through the frontend UI — that is the correct test surface.

## Approved automated actions

- Reading and writing project files
- `npm install`
- `npm run lint`
- `npm test` (uses an in-memory database)
- `npm run build`
- `npm run e2e` (Playwright, fully offline: it starts its own servers on an in-memory database with the test identity, and stops them afterwards)
- `npm run scan:secrets` (reads the git history only)
- `git` operations (add, commit, push) when the prompt asks for them

## Forbidden without explicit user approval

- `curl` / `wget` / `httpie` against any endpoint
- Running the dev server (`npm run dev`)
- Connecting to the real MongoDB
- Calling a real Supabase project (its Auth or Admin API)
- Any command that creates or modifies data in shared systems
- `git push --force` or history rewriting

## Project conventions

- Directories are `frontend/` and `backend/` — never `client/` or `server/`
- Plain JavaScript with ES Modules throughout; no TypeScript
- Simple, tutorial-style code — clear names, a comment at the top of every file explaining what it does, no clever abstractions
- Keep files small and split work into focused subparts
- Backend layering: route → validator → controller → service → model
- Everything under `backend/src/engine/` is PURE: no database, no config, no I/O, no clock reads, no randomness. An ESLint rule enforces this — do not weaken it.
- Frontend calls to Relay's own API always go through `src/lib/apiClient.js`; sign-in and sessions (Supabase Auth) go through `src/lib/auth/`
- Use the existing design tokens; never introduce raw hex values

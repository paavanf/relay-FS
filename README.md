# Relay

Shift rostering, swaps, and fairness tracking. npm workspaces monorepo: `backend` (Express + MongoDB) and `frontend` (React + Vite).

> **Working on this repo with an AI agent?** Read [AGENTS.md](AGENTS.md) first.
> It sets the hard rules - no curl, no live database, no test data - and the
> project conventions. Those rules exist because the dev database is shared
> and real.

## Getting started

```bash
npm install
cp backend/.env.example backend/.env   # optional in development
npm run dev                            # backend :4917 + frontend :5173
```

`/api` is proxied from the Vite dev server to the backend, so the frontend calls relative paths.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs both workspaces via concurrently |
| `npm run build` | Production build of the frontend |
| `npm run lint` | ESLint across both workspaces |
| `npm test` | Backend test suite (Vitest + mongodb-memory-server) |

Add `-w backend` / `-w frontend` to target a single workspace.

## Status

Milestones 0 to 5 are complete:

- **M0 - Foundations** - config, logging, error handling, request context, validation, `GET /api/health`, and the frontend design system (see [frontend/DESIGN.md](frontend/DESIGN.md))
- **M1 - Auth and multi-tenancy** - argon2id, access/refresh tokens, invites, password reset, account lockout
- **M2 - Configuration and team** - qualifications, shift templates, coverage requirements, availability, and the scheduling rules each organisation is rostered against, with the frontend pages for each
- **M3 - Constraint engine** - the pure engine in `backend/src/engine/`, with unit and property-based tests
- **M4 - Roster generation** - greedy construction plus time-boxed local search, run off the main thread as an async job. `npm run evaluate` prints the benchmark table.
- **M5 - Roster UI** - roster CRUD and assignment endpoints, the roster grid with per-day coverage, manual assignment validated against the same constraint engine the generator uses, the unfilled-slots panel, the publish flow, and My Shifts.

Not started: the fairness ledger (M6) and swap chains (M7).

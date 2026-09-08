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

Implemented:

- Infrastructure - config, logging, error handling, request context, validation, `GET /api/health`
- Authentication and multi-tenancy - argon2id, access/refresh tokens, invites, password reset, account lockout
- Milestone 2 - qualifications, shift templates, coverage requirements, availability, with the frontend pages for each
- Milestone 3 - the pure constraint engine in `backend/src/engine/`, with unit and property-based tests
- Frontend design system - see [frontend/DESIGN.md](frontend/DESIGN.md)

Not started: roster generation (M4), manual roster editing (M5), the fairness
ledger (M6), and swap chains (M7).

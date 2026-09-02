# Relay

Shift rostering, swaps, and fairness tracking. npm workspaces monorepo: `backend` (Express + MongoDB) and `frontend` (React + Vite).

## Getting started

```bash
npm install
cp backend/.env.example backend/.env   # optional in development
npm run dev                            # backend :4000 + frontend :5173
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

Infrastructure is implemented: config, logging, error handling, request context, validation,
`GET /api/health`, and the frontend app shell (router, React Query, Tailwind).
Domain models (`backend/src/models/`) and the scheduling engine (`backend/src/engine/`)
are still `// TODO: implement`.

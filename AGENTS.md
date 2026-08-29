# AGENTS.md

Overview of this codebase for developers and AI agents.

## Project Overview

FocoBach — a personal study-tracking app for a student's first year of the IB (Bachillerato Internacional). Users log in with their own account and their data (subjects, notes, diary, deadlines, CAS, Monografía, TdC) is stored per-user in a real database.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Auth | Netlify Identity (`@netlify/identity`) |
| Database | Netlify Database (Postgres) via Drizzle ORM (`@beta` dist-tag) |
| Language | TypeScript 5.9 (strict mode; `src/components/FocoBach.jsx` is plain JS, allowed via `allowJs`/`checkJs: false`) |
| Deployment | Netlify |

## Directory Structure

```
├── db
│   ├── schema.ts               # Drizzle schema: single `app_data` (userId, key, value) table
│   └── index.ts                # Drizzle client (drizzle-orm/netlify-db)
├── drizzle.config.ts           # drizzle-kit config, migrations output to netlify/database/migrations
├── netlify/database/migrations # Generated SQL migrations — regenerate after any schema.ts change
├── src
│   ├── components
│   │   ├── FocoBach.jsx        # Ported app UI (subjects, CAS, Monografía, TdC, diary, calendar, deadlines...)
│   │   └── CallbackHandler.tsx # Handles Identity auth-callback URL hash tokens (signup/recovery/etc.)
│   ├── lib
│   │   ├── auth.ts             # getServerUser server fn returning a serializable SessionUser
│   │   ├── data.ts             # Server functions for app_data CRUD, scoped by authenticated userId
│   │   ├── identity-context.tsx# React context wrapping @netlify/identity (user, ready, logout)
│   │   └── store.ts            # usePersistedStore() client hook — replaces the old local-storage mock
│   ├── middleware
│   │   └── identity.ts         # identityMiddleware / requireAuthMiddleware for server functions
│   └── routes
│       ├── __root.tsx          # Wraps app in IdentityProvider + CallbackHandler
│       ├── index.tsx           # `/` — gated on client-side Identity session, renders FocoBach
│       └── login.tsx           # `/login` — signup/login UI using @netlify/identity
└── tsconfig.json
```

## Key Concepts

### Auth: Netlify Identity

- Only `@netlify/identity` is used (not `netlify-identity-widget` or `gotrue-js`).
- **Does not work on `localhost` / `netlify dev`** — it depends on the `nf_jwt` cookie set by the real GoTrue backend, so login/signup can only be exercised on an actual Netlify deploy.
- Because of this, the `/` route gates access client-side via `useIdentity()` (not an SSR `beforeLoad` check) — the identity state resolves once the app mounts in the browser.
- Server functions that need the current user use `requireAuthMiddleware` (`src/middleware/identity.ts`), which calls `getUser()` server-side and throws if there's no session.

### Data: Netlify Database + Drizzle

- One table, `app_data` (`db/schema.ts`), storing arbitrary string key/value pairs per `userId`, unique on `(userId, key)`.
- All reads/writes go through the server functions in `src/lib/data.ts`, never queried directly from client code.
- `drizzle-orm`/`drizzle-kit` must stay pinned to the `@beta` dist-tag — the `drizzle-orm/netlify-db` adapter only exists on that line.
- After any `db/schema.ts` change, run `npx drizzle-kit generate --name <name>` to produce a migration under `netlify/database/migrations`.

### Ported UI (`FocoBach.jsx`)

- Migrated from a standalone artifact; kept as `.jsx` (not `.tsx`) since it was written without type annotations — retyping ~1000 lines wasn't warranted for a straight port.
- Original `window.storage` mock calls were replaced with `usePersistedStore()` (`store.get`/`set`/`setMany`/`clear`), which mirrors the old API shape closely and debounces per-key writes.
- The original PIN lock screen (`LockScreen`/`Gate`) was removed entirely; auth is now handled upstream by the route and Identity layer, and `FocoBach` takes `{ userLabel, onLogout }` instead.

## Development Commands

```bash
pnpm dev      # Start dev server (vite dev — Identity login will not work here, see README)
pnpm build    # Production build
```

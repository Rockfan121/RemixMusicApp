# Copilot Instructions for RemixMusicApp

## Project Overview

**RemixMusicApp** is a full-stack music player web application that provides an alternative interface for browsing and playing music from [Openwhyd](https://openwhyd.org) — a community music curation service. Users can browse recently added tracks, hot tracks, and playlists by specific Openwhyd users, all with background playback and multiple color themes.

This is a **work in progress**: pagination and Bandcamp playback are not yet implemented.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Router v7 (formerly Remix) with SSR |
| Language | TypeScript 5.9 (strict mode) |
| Server | Express.js v5 |
| Build tool | Vite v7 |
| Database | SQLite via Drizzle ORM + better-sqlite3 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI primitives) |
| Linter/Formatter | Biome v2 |
| Auth | remix-auth + remix-auth-form |
| Music player | react-player |
| Form validation | conform + zod |
| Deployment | Fly.io (Docker container, SQLite on persistent volume) |

---

## Repository Structure

```
RemixMusicApp/
├── app/
│   ├── components/
│   │   ├── ui/            # shadcn/ui components (Button, Card, Dropdown, etc.)
│   │   └── table/         # Track table components (header, container, table)
│   ├── routes/            # React Router v7 file-based routes (see Routing section)
│   ├── services/
│   │   └── openwhyd.ts    # URL builders for all Openwhyd API endpoints
│   ├── types/             # TypeScript type definitions (openwhyd-types.ts, etc.)
│   ├── helpers/           # Utility functions (favorites, recent playlists, media URLs, timeouts)
│   ├── lib/               # Auth, session, forms, user logic (server + client split)
│   ├── db.server/
│   │   └── schema.ts      # Drizzle ORM schema (user + password tables)
│   ├── root.tsx           # Root component with theme switcher, error boundary, Toaster
│   ├── entry.client.tsx   # Client-side React hydration
│   ├── entry.server.tsx   # Server-side rendering entry
│   ├── routes.ts          # Route configuration export
│   ├── globals.css        # Global CSS with Tailwind directives
│   └── config.shared.ts   # App-wide constants (APP_NAME, MAX_FETCHED_ITEMS, etc.)
├── migrations/            # Drizzle SQLite migration files
├── public/                # Static assets
├── screenshots/           # UI screenshots used in README
├── .github/
│   └── workflows/
│       ├── code_quality.yaml  # Biome CI linting check
│       └── codeql.yml         # GitHub CodeQL security scanning
├── server.js              # Express server entry point
├── vite.config.ts
├── tsconfig.json
├── biome.json
├── tailwind.config.cjs    # Custom multi-theme Tailwind configuration
├── drizzle.config.ts      # Drizzle ORM config
├── Dockerfile
└── fly.toml               # Fly.io deployment config
```

---

## Development Setup

### Prerequisites

- Node.js >= 22.12.0
- npm (or pnpm for database migrations)

### Environment Variables

Create a `.env` file in the project root (it is git-ignored):

```env
# Required: used for session encryption
SESSION_SECRET=some_long_random_secret

# Optional in dev (defaults to ./.database); required in production
DB_PATH=./.database
```

The database file is stored at `{DB_PATH}/database.db`. The directory is created automatically on first run.

### First-Time Setup

```bash
npm install
npm run dev      # starts Vite dev server + Express on http://localhost:3000
```

The `npm run dev` command uses `dotenv-cli` to load `.env` before starting the server.

---

## Common Commands

```bash
# Start development server (loads .env automatically)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type-check (also regenerates React Router type helpers)
npm run typecheck

# Run Biome linter (check only)
npm run lint

# Auto-fix linting/formatting issues with Biome
npm run fix

# Generate a new database migration (uses pnpm internally)
npm run generate:migration
```

> **Note**: There is no test runner configured. Do not add one unless explicitly requested.

---

## Routing

Routes use React Router v7 **file-based routing** with a flat-directory convention. The `_shell` prefix creates a shared layout; dots separate path segments.

| Route file | URL path |
|---|---|
| `_shell` | Layout wrapper (sidebar, player) |
| `_shell._index` | `/` (redirects to exploring) |
| `_shell.player.exploring` | `/player/exploring` — browse all playlists |
| `_shell.player.faves` | `/player/faves` — favourite playlists |
| `_shell.player.recent` | `/player/recent` — recently played |
| `_shell.player.tracks.all` | `/player/tracks/all` — all recent tracks |
| `_shell.player.tracks.hot` | `/player/tracks/hot` — hot/popular tracks |
| `_shell.player.tracks.$userId.all` | `/player/tracks/:userId/all` |
| `_shell.player.tracks.$userId.likes` | `/player/tracks/:userId/likes` |
| `_shell.player.tracks.$userId.stream` | `/player/tracks/:userId/stream` |
| `_shell.player.tracks.$userId.$playlistId` | `/player/tracks/:userId/:playlistId` |
| `_shell.account` | `/account` — user account page |
| `_shell.signup` | `/signup` |
| `healthcheck.ts` | `/healthcheck` — Fly.io health probe |
| `logout.ts` | `/logout` |

---

## Openwhyd API Integration

All API URL builders live in `app/services/openwhyd.ts`. They return URL strings that are then `fetch()`-ed in route loaders. No authentication is required. Rate limiting is handled via utilities in `app/helpers/timeouts.ts`. Constants like `MAX_FETCHED_ITEMS` (50) and `MAX_PLAYLISTS` (200) are defined in `app/config.shared.ts`.

---

## Database

- **ORM**: Drizzle ORM (SQLite dialect via better-sqlite3)
- **Schema**: `app/db.server/schema.ts` — defines `user` and `password` tables
- **Migrations**: stored in `migrations/`, generated with `npm run generate:migration`
- The database is initialized automatically when the server starts

The `DB` type exported from schema is used wherever the database instance is passed around:
```ts
import type { DB } from "@/db.server/schema";
```

---

## Authentication

- Uses `remix-auth` with the `FormStrategy`
- Session is stored server-side; session secret comes from `SESSION_SECRET` env var
- Auth utilities are split between server-only (`*.server.ts`) and shared files
- Key files: `app/lib/auth.server.ts`, `app/lib/session.server.ts`, `app/lib/user.server.ts`

---

## Theming

The app supports four color themes: **light**, **dark**, **dkviolet**, and **sky**.

- Themes are implemented as CSS custom properties (`--theme-light`, etc.) in `tailwind.config.cjs`
- The active theme is stored in a cookie and applied via `ThemeSwitcherScript` in `root.tsx`
- Theme utility helpers are in `app/lib/styles.ts`

---

## Code Conventions

- **Imports**: Use the `@/` path alias which maps to `./app/` (e.g. `import { title } from "@/config.shared"`)
- **Server-only files**: Suffix with `.server.ts` / `.server.tsx` (e.g. `auth.server.ts`). These are never bundled for the browser.
- **Biome** enforces the following (errors if violated):
  - `noParameterAssign`, `useAsConstAssertion`, `useDefaultParameterLast`
  - `useSelfClosingElements`, `noUnusedTemplateLiteral`, `noUselessElse`
  - Import organization is enforced automatically (`organizeImports: on`)
- **No unused variables/imports** — Biome will fail the CI check on PRs
- **TypeScript strict mode** is on — avoid `any` and unsafe casts

---

## CI / GitHub Actions

Two workflows run on every push and pull request:

1. **Code Quality** (`.github/workflows/code_quality.yaml`):
   - Runs `biome ci .` (linting + formatting check, no auto-fix)
   - Fails if any Biome rule is violated or if imports are unorganized
   - **Fix locally with**: `npm run fix` before pushing

2. **CodeQL** (`.github/workflows/codeql.yml`):
   - Security scanning for JavaScript/TypeScript
   - Runs on push/PR to `main` and weekly

### Common CI Failure: Biome

If the `Code quality` workflow fails, run `npm run fix` locally to auto-fix most issues, then re-check with `npm run lint`. Manually fix anything `--write` cannot resolve (e.g. logic-related lint errors like `noUselessElse`).

---

## Deployment

The app is deployed to [Fly.io](https://fly.io):

- Config: `fly.toml` (app name: `remix-shadcn`)
- Docker: `Dockerfile` builds and serves the production bundle
- Environment on Fly: `DB_PATH=/data`, `PORT=3000`
- SQLite database is stored on a persistent Fly volume mounted at `/data`
- Health check endpoint: `GET /healthcheck`

To deploy manually: `fly deploy`

---

## Known Limitations / WIP

- **Pagination**: Not yet implemented for any track listing
- **Bandcamp**: `react-player` does not support Bandcamp URLs; those tracks are skipped
- **Favorites/Recent playlists**: UI scaffolding exists but localStorage persistence is commented out
- **No test framework**: No unit or integration tests are configured
- **User auth database**: The schema and auth libraries are wired up but registration/login flow may not be fully functional end-to-end

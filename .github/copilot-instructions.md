# Copilot Instructions

## Stack

React Router v7 (SSR) + Express + SQLite/Drizzle ORM + Tailwind CSS + shadcn/ui + Biome. No test framework. Deployed to Fly.io. Music data comes from the read-only Openwhyd public API; only user/auth data lives in the local SQLite database.

## Commands

```bash
npm run dev                 # Start dev server (Express + Vite HMR)
npm run build               # Production build
npm run start               # Run production build
npm run lint                # Biome check (no auto-fix)
npm run fix                 # Biome check with auto-fix
npm run typecheck           # react-router typegen + tsc
npm run generate:migration  # Generate Drizzle migration from schema changes
```

There is no test runner.

## Architecture

### Request flow

```
Browser -> Express (server.js)
  -> React Router SSR handler
    -> Route loader  -> Openwhyd API (music data)
                     -> SQLite via Drizzle (user/auth data)
    -> Route action  -> SQLite via Drizzle (signup, account update)
  -> Streamed HTML -> hydrates in browser
```

### Load context

`server.js` injects `DB` (Drizzle instance) and `SESSION_SECRET` into every loader/action via `getLoadContext()`. Always type-check against `AppLoadContext` in `app/context.d.ts`.

```typescript
export async function loader({ context }: LoaderFunctionArgs) {
  const { DB, SESSION_SECRET } = context; // always available
}
```

### Authentication

`remix-auth` v3 with `FormStrategy`. Cookie session stored as `_session`. Helper functions in `app/lib/auth.server.ts` and `app/lib/user.server.ts`:

- `getUser(context, request)` — returns user or null
- `requireUser(context, request)` — throws redirect to `/` if unauthenticated

Passwords hashed with bcryptjs (11 rounds) in a separate `password` table.

### Database

Schema: `app/db.server/schema.ts` — two tables: `user` and `password`.
Migrations live in `migrations/` and run automatically on server startup.
To add a column: edit schema → `npm run generate:migration` → commit the generated SQL file.

### Openwhyd API

All Openwhyd URL builders live in `app/services/openwhyd.ts`. Loaders call `fetch()` directly — no abstraction layer. All Openwhyd data is read-only; never write to it.

### Client-side state

No global state store. Playback state lives in `_shell.player/route.tsx` and is passed down via props. Favorites and recently-played playlists are persisted to `localStorage` via helpers in `app/helpers/`.

## Routing Conventions

Flat-file routes under `app/routes/`, using React Router v7 conventions:

- `_shell/route.tsx` — layout route (no URL segment)
- `_shell._index/route.tsx` — matches `/`
- `_shell.player.tracks.$userId.$playlistId/route.tsx` — dynamic segments use `$`
- Each route folder has a `route.tsx` entry point; co-located form schemas/components go in the same folder

## Code Conventions

### Path alias

Always use `@/` to import from `app/`:

```typescript
import { requireUser } from "@/lib/auth.server";
```

### Forms

Forms use [Conform](https://conform.guide/) + Zod. Schemas defined in a `form.ts` file co-located with the route. For routes with multiple actions, use the intent pattern from `app/lib/forms.server.ts`:

```typescript
const intent = await formIntent(formData)
  .define("update", { schema: updateSchema, action: handleUpdate })
  .parse();
```

### Components

- shadcn/ui primitives go in `app/components/ui/` — do not modify these manually; use the shadcn CLI
- Feature components go in `app/components/`
- Use Tabler icons via `@radix-ui/react-icons`

### Theming

Three themes (light, blue, purple) driven by CSS variables in `app/globals.css`. Use `var(--...)` tokens instead of hard-coded colours. The `ThemeSwitcher` component at `app/components/theme-switcher.tsx` manages the active theme.

### Linting

Biome enforces: no parameter reassignment, `as const` assertions, self-closing JSX elements. Run `npm run fix` before committing. CI runs `biome ci .` on every push.

### TypeScript

Strict mode is on. Route loader/action types are generated via `react-router typegen` — always run `npm run typecheck` after adding or renaming routes. Use `useLoaderData<typeof loader>()` for type-safe loader data.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes | Cookie session signing key — server refuses to start without it |
| `DB_PATH` | No | Directory for `database.db` (defaults to `./.database`) |
| `PORT` | No | HTTP port (defaults to 3000) |

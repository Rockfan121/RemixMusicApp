# Copilot Instructions

## Stack

React Router v7 (SSR) + Express + Tailwind CSS v4 + shadcn/ui + Biome. No test framework. All music data comes from the read-only Openwhyd public API. There is no database, authentication, or server-side session management.

## Commands

```bash
npm run dev                 # Start dev server (Express + Vite HMR)
npm run build               # Production build
npm run start               # Run production build
npm run lint                # Biome check (no auto-fix)
npm run fix                 # Biome check with auto-fix
npm run typecheck           # react-router typegen + tsc
```

There is no test runner.

## Architecture

### Request flow

```
Browser -> Express (server.js)
  -> React Router SSR handler
    -> Route loader  -> Openwhyd API (music data, read-only)
                     -> Bandcamp API via bandcamp-fetch (track metadata)
  -> Streamed HTML -> hydrates in browser
```

`server.js` creates a bare `createRequestHandler({ build })` — no `getLoadContext`, no context injection, no database.

### APIs

#### Openwhyd API
All Openwhyd URL builders live in `app/services/openwhyd.ts`. Loaders call `fetch()` directly — no abstraction layer. All Openwhyd data is read-only; never write to it.

#### Bandcamp API
Track metadata is fetched server-side via the `bandcamp-fetch` package in the `api.bandcamp-track` resource route. This route is called client-side by the `BandcampPlayer` component when needed.

### Music player architecture

`_shell.player/route.tsx` is the layout route for all player views. It owns all playback state in React component state (`useState`):

- `playlist` — current track list (`Track[]`)
- `firstTrackNo` — index of the track to start from
- `timestamp` — forces `MusicPlayer` to restart on re-selection of the same playlist
- `playlistUrl` — URL of the currently active playlist

It exposes two callbacks to child routes via `<Outlet context={contextValue} />` typed as `ContextType` (`app/types/context-type.ts`):

- `callback(tracks, startIndex, playlist)` — starts playback and records the playlist to recently-played
- `favesCallback(playlist)` — toggles a playlist in/out of favorites

Child routes receive context with `useOutletContext<ContextType>()`.

### Client-side persistence

No global state store. Favorites and recently-played playlists are persisted to `localStorage` via helpers in `app/helpers/`:

- `app/helpers/favorite-playlists.ts`
- `app/helpers/recent-playlists.ts`

## Routing Conventions

Flat-file routes under `app/routes/`, using React Router v7 conventions:

- `_shell/route.tsx` — layout route (no URL segment)
- `_shell._index/route.tsx` — matches `/`
- `_shell.player.tracks.$userId.$playlistId/route.tsx` — dynamic segments use `$`
- Each route folder has a `route.tsx` entry point; co-located components go in the same folder

## Code Conventions

### Path alias

Always use `@/` to import from `app/`:

```typescript
import { getRecentPlaylists } from "@/helpers/recent-playlists";
```

### Components

- shadcn/ui primitives go in `app/components/ui/` — do not modify these manually; use the shadcn CLI
- Feature components go in `app/components/`
- Use `@radix-ui/react-icons` for icons

### Theming

Multiple themes driven by CSS variables in `app/globals.css`. Use `var(--...)` tokens instead of hard-coded colours. The `ThemeSwitcher` component at `app/components/theme-switcher.tsx` manages the active theme.

### Linting

Biome enforces: no parameter reassignment, `as const` assertions, self-closing JSX elements. Run `npm run fix` before committing. CI runs `biome ci .` on every push.

### TypeScript

Strict mode is on. Route loader/action types are generated via `react-router typegen` — always run `npm run typecheck` after adding or renaming routes. Use `useLoaderData<typeof loader>()` for type-safe loader data.

## Code Quality

### Up-to-date technology

Always use the current stable APIs of the installed package versions listed in `package.json`. Prefer React Router v7 idioms over legacy Remix v2 patterns. Do not suggest deprecated APIs, polyfills for features natively available in Node ≥ 22, or packages that duplicate built-in browser/Node capabilities.

### Efficiency

Write reasonably efficient code:

- Avoid unnecessary re-renders — use `useMemo` / `useCallback` only when the benefit is clear and measurable
- Avoid redundant network requests; prefer streaming SSR loader patterns for large data sets
- Keep bundle size in mind: do not add heavy dependencies for trivial tasks

### Security

Follow OWASP Top 10 guidelines. In particular:

- Validate and sanitize all user-supplied input at every system boundary (loader, action, API route)
- Never expose internal error details or stack traces to the client — log server-side, return a generic message to the browser
- Use `fetch()` with an explicit `AbortSignal` and timeout for all outbound API calls to prevent hanging requests
- Do not construct URLs or query strings by concatenating unsanitized user input — use `URL` / `URLSearchParams`
- Avoid `dangerouslySetInnerHTML`; if unavoidable, sanitize with DOMPurify first
- Set appropriate HTTP response headers (no-store for sensitive responses, correct Content-Type)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (defaults to 3000) |


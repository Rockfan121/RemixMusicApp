# Copilot Instructions

## Stack

React Router v8 (SSR) + Express 5 + Tailwind CSS v4 + shadcn/ui + Biome + Vitest.
All music data comes from the read-only Openwhyd public API.
There is no database, authentication, or server-side session management.

## Runtime & Tooling

- Node: `>=22.12.0`
- Module type: ESM (`"type": "module"`)
- Linting/format checks: Biome (`biome check`)
- Build: React Router build (`react-router build`)
- Testing: Vitest 4 + jsdom + Testing Library + MSW

## Commands

```bash
npm run dev                 # Start dev server (Express + Vite HMR via dotenv-cli)
npm run build               # Production build
npm run start               # Run production build
npm run lint                # Biome check (no auto-fix)
npm run fix                 # Biome check with auto-fix
npm run typecheck           # react-router typegen + tsc
npm run test                # Vitest run
npm run test:watch          # Vitest watch
npm run test:coverage       # Vitest with v8 coverage
```

## Architecture

### Request flow

```
Browser -> Express (server.js)
  -> React Router SSR handler
    -> Route loader  -> Openwhyd API (music data, read-only)
                     -> Bandcamp API via bandcamp-fetch (track metadata)
  -> Streamed HTML -> hydrates in browser
```

`server.js` creates `createRequestHandler({ build, mode: process.env.NODE_ENV })`.

### APIs

#### Openwhyd API
All Openwhyd URL builders live in `app/services/openwhyd.ts`.
Route loaders call `fetch()` directly with those URL builders.
Openwhyd data is read-only; never write to it.

#### Bandcamp API
Track metadata is fetched server-side in `app/routes/api.bandcamp-track/route.ts` using `bandcamp-fetch`.
`BandcampPlayer` calls this resource route client-side when a Bandcamp track is played.

### Music player architecture

`app/root.tsx` owns player state and wires app-wide playback:

- `playlist` — current track list (`Track[]`)
- `firstTrackNo` — index of the track to start from
- `playRequestId` — increments to force a new play request (including replaying same track)
- `playlistUrl` — URL of the currently active playlist
- `recentPl` — recently played playlists from localStorage

`PlayerContext` is defined in `app/types/player-context.ts` and exposes:

- `callback(tracks, startIndex, playlist)` — starts playback and records recently played
- `recentPl` — recent playlists list used by sidebar routes

Playback behavior and player-side effects are implemented in:

- `app/components/music-player.tsx`
- `app/components/use-music-player.ts`
- `app/components/BandcampPlayer.tsx`

### Client-side persistence

No global state store.
Recently played playlists are persisted to `localStorage` via:

- `app/helpers/recent-playlists.ts`

## Routing Conventions

Flat-file routes under `app/routes/` using React Router fs-routes conventions:

- `_index/route.tsx` — home route
- `_player/route.tsx` — player layout route (sidebar + outlet)
- `_player.tracks.$userId.$playlistId/route.tsx` — dynamic segments use `$`
- Each route folder has `route.tsx`; co-located route-specific components stay nearby

## Testing Conventions

- Test runner: Vitest (`app/**/*.test.{ts,tsx}`)
- Default environment: `jsdom`
- Global test setup: `app/test/setup.ts`
- MSW handlers: `app/mocks/handlers.ts`
- MSW server: `app/mocks/server.ts`
- Node-only tests should use `// @vitest-environment node`

## Code Conventions

### Path alias

Always use `@/` to import from `app/`:

```ts
import { getRecentPlaylists } from "@/helpers/recent-playlists";
```

### Components

- shadcn/ui primitives are in `app/components/ui/`
- Feature components are in `app/components/`
- Use `@radix-ui/react-icons` for icons

### Theming

Themes are driven by CSS variables in `app/globals.css`.
Use theme tokens (`var(--...)`) instead of hard-coded colors.
Theme switcher logic lives in `app/components/theme-switcher.tsx` and `app/components/theme-switcher-button.tsx`.

### Linting

Biome rules include (among others):

- `noParameterAssign`
- `useAsConstAssertion`
- `useSelfClosingElements`
- `useUniqueElementIds` (warn)

Run `npm run fix` before committing when possible.

### TypeScript

Strict mode is enabled.
Route types are generated via `react-router typegen`.
Use `useLoaderData<typeof loader>()` for typed loader data.

## Code Quality

### Up-to-date technology

Use current stable APIs from installed package versions in `package.json`.
Prefer React Router v8 idioms over legacy Remix patterns.
Do not add polyfills for features already available in Node >= 22.

### Efficiency

- Avoid unnecessary re-renders; use memoization only when it has clear value
- Avoid redundant network calls
- Avoid heavy dependencies for trivial tasks

### Security

- Validate and sanitize user-supplied input at every boundary (loader/action/resource route)
- Avoid exposing internal server errors to clients
- Use timeouts/abort signals for outbound fetches where feasible
- Build URLs using `URL` / `URLSearchParams` for query parameters
- Avoid `dangerouslySetInnerHTML` unless required and controlled

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (defaults to 3000) |

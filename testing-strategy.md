# Test Strategy

## Scope and Decision Rule

This strategy covers the React Router application, Express host, Openwhyd and Bandcamp boundaries, browser persistence, and playback UI.

The aim is reliable, frequently runnable feedback, not 100% line coverage. Add a direct test when a module has branching behavior, transforms data, owns a browser or network boundary, or contains a user-visible conditional state. Prefer one representative integration test for wiring that repeats across equivalent route variants. Do not duplicate framework, shadcn, Tailwind, or React Router behavior.

Priority definitions:

- **P0**: protects playback, request validation, persistence, or an important failure path. Run on every pull request.
- **P1**: protects a main browsing workflow or meaningful conditional rendering. Run on every pull request once P0 is complete.
- **P2**: cheap regression protection with lower user impact. Add only while touching the module or after a defect.
- **No direct test**: exercise indirectly or rely on library/framework tests; a dedicated test has little return.

## Current Coverage

The current suite has good coverage of pure helpers, the Openwhyd service wrapper, all track-list loaders, the music-player hook, Bandcamp metadata hook, mute adapters, recent-playlist persistence, and the main `TracksContainer` workflow.

The largest gaps are rendering and cross-module behavior:

- The Bandcamp resource route and `BandcampPlayer` have no tests.
- The composed `MusicPlayer`, root callback flow, and recent-playlist UI are untested.
- Theme persistence and the theme selector are untested.
- Playlist browsing/search/filtering and several route views have no rendering tests.
- Search, user, and healthcheck loaders have no direct contract tests.
- Existing `use-bandcamp-track.test.ts` stubs global `fetch`; use MSW instead for its proxy request scenarios so request parameters and response behavior remain realistic.

## Unit Tests

### P0: Server and playback boundaries

| Source | Test file | Required cases | Why this is worth frequent execution |
| --- | --- | --- | --- |
| `app/routes/api.bandcamp-track/route.ts` | `app/routes/api.bandcamp-track/route.test.ts` | Missing `artist` or `track` returns 400; successful `bcFetch.track.getInfo` maps every public field and cache header; missing stream URL returns 404 with `no-store`; thrown dependency error becomes a 500 JSON error. Mock `bandcamp-fetch` and bypass `timeout500`. | This is the only server-side protection for signed Bandcamp media URLs. It is small, deterministic, and prevents broken playback. |
| `app/components/use-bandcamp-track.ts` | expand `app/components/use-bandcamp-track.test.ts` | Replace global fetch stubs with MSW; verify encoded `artist` and `track` query parameters; proxy success, 4xx/5xx, body error, invalid URL, URL change/unmount abort, and timeout. Invalid URLs should settle the loading state if that is the desired UI contract. | The hook translates a user-visible player URL into a network request and error callback. |
| `app/components/use-music-player.ts` | expand existing test | Seek sends the selected fraction to ReactPlayer and Bandcamp refs; progress does not overwrite the slider while seeking; replaying the same track increments request behavior; new playback cancels a pending error skip; a different valid URL is selected after an error; mute sync calls the applicable adapter. | This is the highest-complexity state machine and contains timers, cancellation, refs, looping, and provider-specific behavior. |
| `app/helpers/mute-adapter.ts` | retain existing test | Keep YouTube, Vimeo, SoundCloud, unsupported input, and rapid-toggle sequencing. Add a rejected Vimeo `setMuted` case only if the production behavior is intentionally defined. | Existing tests already give high signal for platform-specific code. |

### P1: Pure logic and conditional components

| Source | Test file | Required cases | Notes |
| --- | --- | --- | --- |
| `app/components/theme-switcher.tsx` | `app/components/theme-switcher.test.tsx` | `getTheme` defaults invalid/missing values to `system`; `setTheme` writes/removes localStorage and `data-theme`; `lightOrDarkTheme` maps the custom dark themes; SSR-safe HTML renders without `document`; inline script is present. | Clear localStorage and `data-theme` for every test. |
| `app/components/playlists.tsx` | `app/components/playlists.test.tsx` | Global empty state shows the explanatory alert plus All/Hot cards; user view shows All/Likes/Stream cards and user playlists; typing filters case-insensitively; a no-match filter produces an empty grid without accidentally switching to the global fallback; links and counts target the expected routes. | Render in a memory router and use label/role/text queries. This is the main conditional rendering gap. |
| `app/components/table/use-tracks-loader.ts` | either a hook test or expansion of `tracks-container.test.tsx` | Hot pagination sends `skip`; regular pagination prefers `order` but falls back to `_id`; response appends rather than replaces; empty next page updates `hasMore`; navigation to another pathname resets accumulated tracks. | The container already covers one standard Load More flow, so add only the branch-specific cases. |
| `app/components/duration.tsx` | `app/components/duration.test.tsx`, P2 | `0`, sub-minute, minute rollover, and hour rollover render a valid `time` element. | Small, stable test; it can wait until the component changes. |
| `app/config.shared.ts` | `app/config.shared.test.ts`, P2 | `title()` and `title(pageTitle)` results. | Low risk; do not test numeric constants merely for coverage. |

### Existing unit tests to retain, not duplicate

- `app/helpers/apiplaylist-helpers.test.ts`: route and image mapping branches.
- `app/helpers/media-url.test.ts`: provider URL conversion and Bandcamp recognition.
- `app/helpers/recent-playlists.test.ts`: ordering, deduplication, malformed storage, and retention cap.
- `app/helpers/timeouts.test.ts`: abortable `sleep` behavior.
- `app/services/openwhyd.test.ts`: URL builders, typed wrappers, pagination boundaries, and error contracts.
- Track loader tests in `app/routes/_player.tracks.*/*.test.ts`: loader-level Openwhyd success, pagination, and fallback contracts.

Do not create separate tests for the five `timeout*` wrappers. Their behavior is direct `setTimeout` delegation and is already exercised by the callers that matter.

## Integration Tests

Use Vitest, React Testing Library, `createMemoryRouter`, `RouterProvider`, user-event, and MSW. These tests should observe accessible UI and navigation, never CSS classes or component internals.

### P0: Playback and persistence flows

| Flow | Suggested test file | Scenario and assertions |
| --- | --- | --- |
| Select a track and start playback | `app/root.test.tsx` | Render the root with a child route containing a tracks table and a mocked media component. Click a track. Assert the active track title changes in the footer, playback is requested with the selected media URL, and the clicked playlist becomes the first localStorage recent item. Repeat the same track to prove `playRequestId` causes a new request. |
| Music player controls and provider choice | `app/components/music-player.test.tsx` | Mock `react-player` as an accessible media test double. Assert empty playlist disables seeking; play/pause, previous/next, mute, loop, fullscreen, and seeking update user-visible control state and call the media callback. Supply a Bandcamp URL and assert `BandcampPlayer` is used instead of ReactPlayer. Exercise an error and assert the toast/skip outcome through the composed UI. |
| Bandcamp player media lifecycle | `app/components/BandcampPlayer.test.tsx` | With MSW resolving the proxy, assert loading then cover/image and hidden audio source; dispatch can-play, play, pause, duration, progress, ended, and error events; assert callbacks. Verify ref `seekTo`, `setMuted`, and `getMuted`. |
| Recent playlist view | `app/routes/_player.recent/route.test.tsx` | Preload localStorage, render the route, and assert persisted cards appear after hydration. With no storage, assert the empty alert and global fallback cards. |

### P1: Browsing and route rendering

| Flow | Suggested test file | Scenario and assertions |
| --- | --- | --- |
| Home search navigation | `app/routes/_index/route.test.tsx` | Enter a search phrase and submit; assert navigation reaches `/exploring/<encoded-query>`. Cover an empty submission according to the intended product behavior. |
| Search loader and results | `app/routes/_player.exploring.$query/route.test.tsx` | MSW success: loader sends the query, duplicate playlists render once, and playlist/track/user links are correct. Server failure: headings remain and all result sections are empty without throwing. |
| User playlist browsing | `app/routes/_player.user/route.test.tsx` | No `q`, blank `q`, API error payload, successful profile with playlists, and a non-200/network failure once the loader has an explicit error policy. Assert the rendered title, special cards, and empty fallback. |
| Track route rendering | one representative static route plus `app/routes/_player.tracks.$userId.$playlistId/route.test.tsx` | Feed loader data through a memory router. Assert tracks table for success, empty-playlist alert for an empty list, deleted-playlist alert for missing metadata, and Load More visibility. The loader tests already cover all three special route variants, so rendering one special route and the generic route is enough. |
| Player layout navigation state | `app/routes/_player/route.test.tsx` | Render nested routes and assert All, Hot, and Recently Played navigation destinations plus recent playlist sidebar content. A deferred child loader should expose the loading state without asserting Tailwind class strings; add an accessible `aria-busy` indicator first if this state matters to users. |
| Theme selector | `app/components/theme-switcher-button.test.tsx` | Open the menu, choose each theme through its accessible menu item/button, assert `aria-pressed`, `data-theme`, and persisted localStorage. |
| Root error boundary | `app/root.test.tsx` | Route 404 produces `404` and `Page Not Found`; a thrown error produces `500` and the generic message. Mock `console.error` for the thrown-error case. |

### P2: Deployment smoke test

After `npm run build`, start the production server once in CI or before deployment and request `/healthcheck` and one SSR route. Assert 200, the health response body, HTML content type, and a recognizable route heading. This validates Express wiring, the production React Router build, and SSR together. It should not be a per-commit browser suite if startup time makes it slow.

A full Playwright suite is not currently justified: the application has no authenticated or write workflow, and its main behavior can be exercised deterministically with RTL. Reconsider one browser smoke test after adding service workers, authentication, uploads, or a more complex responsive interaction.

## Files That Should Not Receive Dedicated Tests

These are either library wrappers, static type declarations, configuration, or are adequately exercised by their parents:

- `app/components/ui/*`: shadcn/Radix wrappers. Test application behavior that uses them, not class composition or Radix behavior.
- `app/types/*`: TypeScript compile-time contracts only.
- `app/lib/styles.ts`, `app/routes.ts`, `app/entry.client.tsx`, and `react-router.config.ts`: no custom decision logic needing a separate test.
- `app/entry.server.tsx`: framework-derived streaming code. Add a focused test only after custom headers, status policy, or stream transformation is introduced.
- `app/components/captioned-image.tsx`, `item-cover.tsx`, `user-link.tsx`, `navbar-button.tsx`, `header.tsx`, `tracks-header.tsx`, and `tracks-replacement.tsx`: cover through playlist, tracks, layout, and root integration tests. A direct test is warranted only after they gain independent interaction or data transformation.
- `server.js`: keep it covered by the production smoke test. Export an Express app only if middleware policy becomes complex enough to need a focused HTTP suite.
- `app/mocks/*` and `app/test/setup.ts`: test infrastructure, verified by every request test rather than by tests of their own.

## Test Architecture and Execution

- Put a direct test next to its source as `*.test.ts` or `*.test.tsx`.
- Keep loader/resource tests in Node with `// @vitest-environment node`; keep UI and hook tests in jsdom.
- Use MSW for Openwhyd and the internal Bandcamp proxy. Use `vi.mock("bandcamp-fetch")` only at the resource-route dependency boundary, where MSW cannot intercept an in-process package call.
- Add `app/test/factories.ts` for complete `Track`, `ApiPlaylist`, search-result, and Bandcamp payload factories. This removes duplicated partial fixtures and makes UI tests type-safe.
- Reset MSW handlers, localStorage, DOM attributes, spies, and fake timers after each relevant test. The global MSW reset already exists; browser state still needs local test cleanup.
- Use fake timers for `sleep`, watchdog, and route artificial delays. Do not wait for real 200/300/500/1000 ms delays.
- Use `getByRole`, `getByLabelText`, and `findByRole`; give icon-only controls accessible names before testing them. Avoid selectors tied to Tailwind classes, DOM depth, or implementation state.

## Delivery Order

1. Add P0 tests for the Bandcamp resource route, Bandcamp player, composed music player, and root playback-to-recent-history flow.
2. Convert the Bandcamp hook's network tests to MSW and close its abort/timeout request-contract gaps.
3. Add P1 tests for `PlaylistsList`, theme state/button, Recent, home search, Search results, User browsing, and route error rendering.
4. Expand track loading only for its untested hot/reset/fallback branches.
5. Add the production smoke test after the unit/integration suite is stable; do not block early work on a broad end-to-end suite.

This order adds durable regression protection to the highest-risk user paths while keeping the regularly-run Vitest suite fast and focused.

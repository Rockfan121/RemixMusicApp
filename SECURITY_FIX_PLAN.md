# Security remediation plan

## Scope and principles

This plan is based on `SECURITY_REPORT.md` and the current implementations in `server.js`, `app/services/openwhyd.ts`, `app/routes/api.bandcamp-track/route.ts`, `app/components/use-bandcamp-track.ts`, `app/helpers/media-url.ts`, `app/helpers/recent-playlists.ts`, `app/components/theme-switcher.tsx`, `app/entry.server.tsx`, their tests, and the Docker/workflow configuration.

Use existing Node >=24.21.0 APIs (`URL`, `URLSearchParams`, `AbortSignal.timeout`) and `@/` imports. Do not add a dependency for validation, timeouts, or headers unless the dependency-free implementation proves inadequate. Preserve currently valid Openwhyd identifiers and supported YouTube, SoundCloud, DailyMotion, Vimeo, and Bandcamp playback. Every step must retain React Router v8 typed loader usage and pass Biome.

## Prioritisation

Rank is risk reduction divided by implementation effort.

| Rank | Phase | Steps | Rationale |
|---|---|---|---|
| 1 | 0 | S0 | Resolves the only decision that determines whether the public Bandcamp endpoint may remain enabled. |
| 2 | 1 | S1, S2, S3, S4, S5 | Small, testable changes that close direct input/error/timeout/storage gaps. |
| 3 | 2 | S6, S7, S8, S9 | Shared validation/fetch architecture and a CSP rollout require broader regression coverage. |
| 4 | 3 | S10, S11, S12 | Operational and supply-chain hardening. |
| 5 | 4 | S13 | Defer low-value or externally constrained work unless threat model changes. |

## Phase 0 — Open decisions (waiting for approval)

### S0 — Decide the future of the server-side Bandcamp proxy

- **Finding:** SEC-001 (and controls in SEC-003, SEC-004, SEC-010).
- **Files affected after approval:** `app/routes/api.bandcamp-track/route.ts:5-47`, `app/components/use-bandcamp-track.ts:9-108`, route tests, and possibly `app/components/BandcampPlayer.tsx`.
- **Option A — keep the proxy with strict validation (recommended):** Accept a Bandcamp subdomain label and track slug only, construct `https://<artist>.bandcamp.com/track/<track>`, reject all malformed values before `bandcamp-fetch`, and apply the timeout/error/abuse controls described below. This retains current Bandcamp playback for conventional `artist.bandcamp.com/track/slug` URLs.
- **Option B — remove/disable the proxy:** Do not call `bandcamp-fetch`; mark Bandcamp tracks unsupported or use a direct browser-side provider path. This eliminates server-side SSRF but changes Bandcamp playback and may lose signed-stream functionality.
- **Trade-offs:** Option A preserves user behavior but requires maintaining Bandcamp URL policy and testing library redirect behavior. Option B has the smallest server attack surface but is a visible product change.
- **Recommendation:** Approve Option A, but verify with a staging deployment that `bandcamp-fetch` does not follow redirects to non-Bandcamp hosts; otherwise the library must expose redirect control or the proxy should be disabled.
- **Behaviour impact:** Option A: **⚠️ BEHAVIOUR CHANGE** — malformed/non-Bandcamp URLs receive 400 rather than a lookup. Option B: **⚠️ BEHAVIOUR CHANGE** — Bandcamp playback changes or disappears.
- **Dependencies:** No implementation step for the proxy proceeds until this choice is approved.

## Phase 1 — Quick wins

### S1 — Validate and safely construct Openwhyd request URLs

- **Findings:** SEC-011.
- **Files:** modify `app/services/openwhyd.ts:9-75`; add/update `app/services/openwhyd.test.ts:28-175`; modify dynamic route loaders only if they need to translate validation failures to 400/empty results.
- **Change:** Create small local helpers in `openwhyd.ts`: one for a required path segment, one optional cursor segment, and one URL builder rooted at `new URL("https://openwhyd.org")`. Use `encodeURIComponent` for every path component and `URLSearchParams` for `q`, `after`, `id`, `limit`, and `skip`. Preserve normal output URLs and omit optional query parameters rather than serializing `undefined`.

  ```ts
  const url = new URL("/search", OPENWHYD_ORIGIN);
  url.search = new URLSearchParams({ q: query, format: "json" }).toString();
  return url.toString();
  ```

- **Behaviour impact:** None for valid searches/IDs. Invalid/missing values should be handled explicitly rather than sending literal `undefined`; if routes begin returning 400, flag that separately before release.
- **Tests:** In `openwhyd.test.ts`, retain normal URL assertions and add `../`, `%2F`, `/`, `?x=1`, `#fragment`, CRLF-looking input, Unicode, spaces, and `after`/search values containing `&`. Assert hostname remains `openwhyd.org`, unexpected parameters cannot be introduced, and identifier content remains one encoded segment.
- **Manual verification:** Load normal user/playlist/search routes; inspect server-side mocked/observed requests and confirm the expected decoded Openwhyd input. Request a crafted path/query and verify it cannot alter host/path/query semantics.
- **Effort / risk:** Easy (<2 h), Low.
- **Dependencies:** None; S6 consumes these builders.

### S2 — Sanitize Bandcamp proxy failures

- **Findings:** SEC-010.
- **Files:** modify `app/routes/api.bandcamp-track/route.ts:40-45`; update `app/routes/api.bandcamp-track/route.test.ts:147-176`.
- **Change:** Preserve server-side diagnostic logging with request-safe context (never echo arbitrary URL/error values to clients); return a stable generic JSON error such as `{"error":"Unable to fetch track metadata"}` and an appropriate 502/504 status. Keep `Cache-Control: no-store`.
- **Behaviour impact:** None for successful playback; clients receive a generic error instead of upstream text.
- **Tests:** `// @vitest-environment node` remains required. Make `bcFetch.track.getInfo` reject an error containing a fake internal hostname and assert the response does not include it, retains `no-store`, and has the generic error/status.
- **Manual verification:** Call the endpoint with a deliberately unavailable valid Bandcamp slug and confirm the response excludes library/network details while server logs retain enough context for diagnosis.
- **Effort / risk:** Trivial (<15 min), Low.
- **Dependencies:** S0/S7 should share its final failure status mapping.

### S3 — Bound Node HTTP connection/request lifetimes

- **Findings:** SEC-012.
- **Files:** modify `server.js:49-51`; add a focused Node test only after extracting server creation/listening into an importable module, otherwise manually verify.
- **Change:** Retain the current default bind behavior unless deployment requirements specify `HOST`; retain the returned server from `app.listen`, then assign explicit, documented `headersTimeout`, `requestTimeout`, and `keepAliveTimeout` values compatible with Fly/reverse-proxy limits. Parse `PORT` as a finite valid port and fail startup clearly for invalid configuration.
- **Behaviour impact:** **⚠️ BEHAVIOUR CHANGE** — deliberately slow or malformed HTTP clients may be disconnected earlier; confirm timeout values with deployment owners.
- **Tests:** If server construction is extracted, assert configured timeouts and invalid `PORT` rejection in a Node-environment test. Do not test real slowloris behavior in the unit suite.
- **Manual verification:** Start production server, inspect configured timeout values, and use `curl --limit-rate`/a partial-header test against staging; confirm normal SSR pages and Fly health checks continue working.
- **Effort / risk:** Easy (<2 h), Medium (proxy compatibility).
- **Dependencies:** Confirm deployment proxy timeouts first.

### S4 — Validate recent-playlist storage and theme bootstrap values

- **Findings:** SEC-008, SEC-013.
- **Files:** modify `app/helpers/recent-playlists.ts:11-49`, `app/helpers/recent-playlists.test.ts`; modify `app/components/theme-switcher.tsx:34-48`, `app/components/theme-switcher.test.tsx` (create if absent).
- **Change:** Add a dependency-free type guard that accepts only a bounded array (at most `MAX_PLAYLISTS`) of plain playlist records with the fields consumed by `myUrl`/sidebar rendering: string `id`, `name`, `uId`, `uNm`, `plId`, and finite numeric `nbTracks`. Drop invalid entries and return `[]` for invalid JSON/non-array values. Keep storage exceptions caught. Make the static pre-hydration script compare `localStorage.theme` to the existing five literal themes before calling `setAttribute`.
- **Behaviour impact:** None for valid data; corrupt or stale recent-playlist data is cleared/ignored.
- **Tests:** jsdom tests for malformed JSON, object instead of array, oversized arrays, nulls, wrong field types, and a valid playlist retaining order. Execute the bootstrap script or assert its allowlist source includes only allowed values; verify unknown theme is not assigned and valid themes still prevent FOUC.
- **Manual verification:** Add/play recent playlists, reload, and verify sidebar order. Manually set invalid `recentPlaylists` and `theme` in DevTools, reload, and confirm no exception/unexpected attribute.
- **Effort / risk:** Easy (<2 h), Low.
- **Dependencies:** None.

### S5 — Pin CI tool versions and container install inputs

- **Findings:** SEC-006, SEC-009.
- **Files:** modify `.github/workflows/code_quality.yaml:12-16`, `.github/workflows/codeql.yml:58,62,90`, `Dockerfile:2-47`; optionally create `.github/dependabot.yml`.
- **Change:** Pin Actions to reviewed full commit SHAs with version comments and pin Biome setup to the repository’s expected Biome version rather than `latest`. Change Docker installs to `npm ci` and run the final container with a dedicated non-root user. Pin the Node 24.21.0 base image by digest only after choosing a supported image digest. Add Dependabot only if repository owners accept automated update PRs.
- **Behaviour impact:** None for application behavior; image/action updates need routine maintenance.
- **Tests:** Build the Docker image in CI/staging and verify it can write only required runtime paths. Validate workflow YAML syntax; confirm CodeQL and quality workflows still run.
- **Manual verification:** `docker build`, run with the configured port, request `/healthcheck` and an SSR page; inspect `id` in the container.
- **Effort / risk:** Easy (<2 h), Low.
- **Dependencies:** No runtime dependency. Dependabot is optional policy/configuration.

## Phase 2 — Important structural fixes

### S6 — Add a central validation and Openwhyd boundary layer

- **Findings:** SEC-007, SEC-011.
- **Files:** create `app/services/openwhyd-validation.ts`; modify `app/services/openwhyd.ts:9-259`; update all route loaders under `app/routes/_player.*/*` that consume dynamic params or raw response data; extend `app/services/openwhyd.test.ts`.
- **Change:** Keep URL builders and response parsing together at the service boundary. Export narrow validators for user IDs, playlist IDs, cursors, search strings, and API response structures (`Track`, `ApiPlaylist`, `UserPlaylist`, user info, search envelope). Use handwritten guards/normalizers rather than adding Zod/Valibot: the response shapes are limited and existing TypeScript types identify required fields. Reject malformed route identifiers before a fetch; normalize or discard malformed upstream items and fail safely where required top-level data is invalid.
- **Behaviour impact:** None for valid Openwhyd records. **⚠️ BEHAVIOUR CHANGE** only if Openwhyd currently emits records missing fields that the new contract rejects; rollout by logging/counting invalid records in staging first.
- **Tests:** MSW node tests for malformed JSON, wrong content type, valid partial optional records, invalid track array members, invalid search envelopes, and route params containing traversal/query separators. Verify no malformed record reaches `TracksTable`, `CaptionedImage`, or player state.
- **Manual verification:** Browse all, hot, user, likes, stream, playlist, and search routes with ordinary Openwhyd content; compare playlist counts and playback to baseline.
- **Effort / risk:** Medium (<1 day), Medium.
- **Dependencies:** S1 first. No new schema dependency proposed; reconsider Valibot only if guards become duplicated or substantially more complex.

### S7 — Implement the approved Bandcamp proxy policy

- **Findings:** SEC-001, SEC-003, SEC-004, SEC-010.
- **Files:** modify `app/routes/api.bandcamp-track/route.ts:5-47`, `app/components/use-bandcamp-track.ts:9-15`; update route/hook tests; potentially create `app/services/bandcamp-validation.ts`.
- **Change (only after S0 approval):** Use a single parser that accepts a lower-case DNS-label artist (`[a-z0-9-]`, with no slash, dot, `@`, port, or IP literal) and a non-empty single track path segment. Build the URL from encoded components, parse it, then assert `protocol === "https:"`, no username/password/port, and hostname exactly `${artist}.bandcamp.com`. Client parsing must call the same semantic policy before generating query params. Confirm whether `bandcamp-fetch` can disable or inspect redirects; if it cannot, document the verified behavior and constrain deployment egress as a compensating control.
- **Behaviour impact:** **⚠️ BEHAVIOUR CHANGE** — malformed/custom-domain Bandcamp URLs will not play unless explicitly supported by an approved allowlist.
- **Tests:** Node route tests for valid slugs; `../`, `%2F`, `%252F`, slash, `@`, `artist@host`, `127.0.0.1`, IPv6, port, whitespace, empty values, query/fragment, and non-Bandcamp/custom hosts. Assert rejection occurs before `bcFetch`. Hook tests for matching accepted/rejected URLs. Add a redirect test only if the library’s fetch transport can be mocked.
- **Manual verification:** Play several existing `artist.bandcamp.com/track/slug` records, including a replay of the same track; curl rejected values and verify 400/no external request; inspect staging egress/logs for redirect destinations.
- **Effort / risk:** Medium (<1 day), Medium.
- **Dependencies:** S0 decision; S2; S8 for shared outbound error/timeout handling.

### S8 — Introduce a reusable server-side outbound-fetch wrapper

- **Findings:** SEC-004, SEC-007, SEC-010.
- **Files:** create `app/services/fetch-server.ts`; modify `app/services/openwhyd.ts:97-259`, relevant direct route fetches (`app/routes/_player.exploring.$query/route.tsx:18-34`, `app/routes/_player.user/route.tsx:14-33`), and Bandcamp integration where library APIs permit; create `app/services/fetch-server.test.ts`.
- **Change:** Implement a small `fetchJson`/`fetchText` wrapper around native `fetch` with `AbortSignal.timeout`, optional caller signal composition, fixed redirect policy appropriate to the trusted Openwhyd host, status validation, expected content-type validation, and an explicit maximum byte count read via `response.body` reader before JSON parse. Throw a typed, sanitized upstream error suitable for loaders while logging diagnostic details server-side. Do not retry automatically.
- **Behaviour impact:** None for responsive, conforming upstreams. **⚠️ BEHAVIOUR CHANGE** for upstream responses exceeding the chosen limit, non-JSON content, redirects, or timeouts; select limits from measured payloads first.
- **Tests:** `// @vitest-environment node` tests with MSW for success, 4xx/5xx, timeout/abort, wrong content type, malformed JSON, redirected response policy, and oversized streamed body. Route tests must verify sanitized response behavior and no retry storm.
- **Manual verification:** Browse normal data routes; emulate delayed/oversized upstream responses in staging/MSW; confirm bounded failure time, generic user-facing error, and diagnostic server log.
- **Effort / risk:** Medium (<1 day), Medium.
- **Dependencies:** S1; coordinate with S7 because `bandcamp-fetch` may not expose native fetch options.

### S9 — Roll out browser security headers and CSP safely

- **Findings:** SEC-002.
- **Files:** modify `server.js:22-47`; modify `app/entry.server.tsx:11-123`, `app/root.tsx:33-54`, and `app/components/theme-switcher.tsx:34-48` for nonce propagation; create header tests.
- **Change:** Start with non-CSP headers set by a small local Express middleware: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: cross-origin`, and `frame-ancestors 'self'` via CSP (use `X-Frame-Options: DENY` only as a compatibility companion if required). Enable HSTS only in confirmed HTTPS production deployments.

  Generate one per-request nonce in Express; place it in request context/response headers so `entry.server.tsx` can place it on React Router scripts and `ThemeSwitcherScript` in `root.tsx` can use it. Do not use `'unsafe-inline'` for scripts.

  Begin with `Content-Security-Policy-Report-Only` and a report endpoint/service chosen by the owner. Candidate policy, to be verified from actual browser violations:

  ```text
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'self';
  script-src 'self' 'nonce-{nonce}' https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com https://w.soundcloud.com https://bandcamp.com https://*.bandcamp.com;
  frame-src https://www.youtube.com https://www.youtube-nocookie.com https://w.soundcloud.com https://bandcamp.com https://*.bandcamp.com https://www.dailymotion.com https://player.vimeo.com;
  img-src 'self' data: https://openwhyd.org https://i.ytimg.com https://*.scdn.co https://*.bandcamp.com;
  media-src 'self' https: blob:;
  connect-src 'self' https://openwhyd.org https://*.bandcamp.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  ```

  The `style-src 'unsafe-inline'` exception is retained initially for Tailwind/component runtime style compatibility and must be narrowed only after inspection. Do not enforce until Report-Only telemetry covers all supported players.
- **Behaviour impact:** **⚠️ BEHAVIOUR CHANGE** at enforcement: omitted provider origins will block embeds/media. Report-Only itself is invisible.
- **Tests:** Header integration tests for normal SSR and resource responses, nonce uniqueness, nonce presence on the inline theme script/React Router scripts, and no nonce reflection from user input. Browser/manual tests across YouTube, SoundCloud, Bandcamp, DailyMotion, Vimeo, Openwhyd images, and hydration.
- **Manual verification:** Use browser DevTools CSP console/report endpoint in Report-Only mode; exercise SSR navigation, theme switching, all player types, replay, and image rendering before changing to enforcing CSP.
- **Effort / risk:** Medium to Hard (>1 day including telemetry), High at enforcement.
- **Dependencies:** S4 makes theme nonce/allowlist work safer; S7/S8 clarify required Bandcamp origins.

## Phase 3 — Hardening and hygiene

### S10 — Apply bounded abuse protection to the Bandcamp resource route

- **Findings:** SEC-003.
- **Files:** modify `server.js:22-47` or create `app/middleware/rate-limit.ts`; modify `app/routes/api.bandcamp-track/route.ts`; add Node/integration tests and deployment configuration documentation.
- **Change:** Prefer a reverse-proxy/WAF rate limit because the app has no shared store and may run multiple instances. If an in-process control is still needed, implement a bounded fixed-window per-IP limiter only after deciding trustworthy proxy headers (`trust proxy`) and cleanup strategy; never use unbounded Maps. Apply concurrency protection around Bandcamp lookups and a small bounded cache only for validated canonical inputs.
- **Behaviour impact:** **⚠️ BEHAVIOUR CHANGE** — clients exceeding the documented threshold receive 429; cache may delay metadata changes.
- **Tests:** Node tests for limits, expiry, memory bounds, 429 headers, and independent clients. Verify no spoofed forwarded header is trusted unless the deployment proxy configuration is explicit.
- **Manual verification:** Burst a staging endpoint below/above limit, confirm normal playback is unaffected, 429 response is predictable, and multi-instance behavior follows the chosen reverse-proxy policy.
- **Effort / risk:** Medium (<1 day), Medium.
- **Dependencies:** S0/S7 first; deployment owner must approve rate-limit location and `trust proxy` policy.

### S11 — Improve security linting and test coverage

- **Findings:** SEC-005, SEC-007, SEC-008, SEC-013.
- **Files:** modify `biome.json:12-38`; add tests beside `media-url`, storage, Bandcamp, Openwhyd, and theme code.
- **Change:** Enable available Biome security rules that catch dangerous HTML, blank targets, global eval, and suspicious URL/DOM use without broad suppressions. Retain the single justified inline-theme suppression only until S9 nonce work removes or scopes it. Add focused tests for each validator/wrapper rather than weakening strict TypeScript with casts.
- **Behaviour impact:** None.
- **Tests:** Lint itself is the verification; add regression tests for `javascript:`, `data:`, unknown schemes, non-Bandcamp hosts, malformed storage, and malformed API payloads.
- **Manual verification:** Run lint and review every new diagnostic/suppression; no blanket ignores.
- **Effort /risk:** Easy (<2 h), Low.
- **Dependencies:** S4, S6, S7 make the rules actionable.

### S12 — Dependency, image, and CI maintenance policy

- **Findings:** SEC-006, SEC-009; dependency audit result.
- **Files:** `package.json`, `package-lock.json`, Dockerfile, workflows, and optionally `.github/dependabot.yml`.
- **Change:** Resolve the dev-only `postcss-selector-parser` advisory only after confirming the compatible Tailwind/Typography update path; do not apply npm audit’s suggested downgrade blindly. Establish a scheduled `npm audit --omit=dev` plus full-audit review, pinned GitHub Action update cadence, and Node/base-image digest review.
- **Behaviour impact:** None until a dependency major upgrade is approved.
- **Tests:** Existing lint/typecheck/test/build and Docker smoke test after each update.
- **Manual verification:** Confirm audit output has zero production vulnerabilities; document any accepted dev-only advisory with reachability and expiry.
- **Effort / risk:** Easy (<2 h) for policy; Medium for upgrades.
- **Dependencies:** S5.

## Phase 4 — Nice-to-have / defer

### S13 — Decide whether to constrain raw `fi`/unknown media URLs

- **Findings:** SEC-005.
- **Files:** `app/helpers/media-url.ts:3-48`, `app/components/table/tracks-table.tsx:80-86`, `app/components/music-player.tsx:193-231`, media helper/player tests.
- **Change:** First inventory real Openwhyd `fi` and unknown `eId` formats. If they must remain supported, permit only parsed HTTPS URLs plus a product-approved host set before rendering `href`, `img`, audio, or handing to React Player; use a safe disabled/skipped-track fallback.
- **Behaviour impact:** **⚠️ BEHAVIOUR CHANGE** — unsupported hosts/schemes cannot be opened or played.
- **Tests:** `javascript:`, `data:`, `file:`, `http:`, malformed URL, unknown service, approved provider, and valid raw HTTPS `fi` URL cases. Preserve YouTube/SoundCloud/Bandcamp output.
- **Manual verification:** Open representative real tracks for every provider and validate developer-console/network behavior.
- **Effort / risk:** Medium (<1 day), Medium.
- **Dependencies:** Product owner must approve supported provider/host matrix; S6 validation should precede it.
- **Justification for deferral:** The report found arbitrary client URL propagation but no confirmed XSS or credential exposure; allowlisting may remove legitimate providers.

## Whole-effort definition of done

All commands pass:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --omit=dev
npm audit
```

Expected audit result: zero production vulnerabilities; any remaining development-only advisory is documented with version, reachability, mitigation, owner, and review date.

Manual regression checklist:

1. SSR-render home, search, all, hot, user, playlist, likes, and stream pages.
2. Play YouTube, SoundCloud, and Bandcamp tracks; replay the same track.
3. Confirm Bandcamp invalid/non-Bandcamp inputs return generic errors without an outbound request.
4. Create, reload, and clear the recently played list; corrupt its localStorage value and confirm safe recovery.
5. Switch every supported theme; reload without FOUC or hydration mismatch.
6. Verify headers/CSP Report-Only then enforced CSP in browser DevTools with no violations for supported playback.
7. Confirm health checks, Docker non-root runtime, production server timeouts, and rate-limit behavior in staging.

## Suggested commit / PR breakdown

1. **PR 1:** S1, S2, S4 — encoded Openwhyd URLs, generic Bandcamp errors, validated local storage/theme; fully unit-tested.
2. **PR 2:** S3, S5 — explicit server timeouts/port validation plus Docker/CI pins; deploy/staging review required.
3. **PR 3:** S6 and S8 — Openwhyd response boundary and native fetch wrapper with MSW timeout/size tests.
4. **PR 4:** S0-approved S7 and S10 — Bandcamp proxy policy and abuse protection; security/staging sign-off required.
5. **PR 5:** S9 — headers first, CSP Report-Only telemetry, then a separate enforcement PR after clean telemetry.
6. **PR 6:** S11/S12 — lint rule coverage and dependency-maintenance policy.
7. **PR 7 (optional):** S13 — external media allowlist after product approval.

Each commit/PR should be independently revertable, must update tests with the change, and must not bundle dependency upgrades with unrelated security behavior changes.

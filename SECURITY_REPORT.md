# Security report

## 1. Executive summary

Security posture: **not safe to expose publicly until the SSRF is fixed**.
One public resource route turns attacker-controlled input into the hostname of a server-side request.
The server also lacks a browser-security-header policy, outbound request deadlines, and abuse controls.
Openwhyd, Bandcamp, and localStorage data are largely trusted by type assertion rather than runtime validation.
No committed secrets were found in the working tree or available Git history.
`npm audit --omit=dev` found no production dependency advisories; the full audit found one dev-only advisory chain.
Findings: **Critical 0, High 0, Medium 1, Low 6, Informational 6**.

## 2. 🚨 Decisions needed

### SEC-001 — Public Bandcamp endpoint is an SSRF primitive

**Problem:** `/api/bandcamp-track` can be induced to request an arbitrary HTTPS host, including reachable internal services.  
**Options:** (1) strictly allowlist valid Bandcamp subdomains and reject malformed path components, or (2) remove/disable this server-side proxy.  
**Recommendation:** Do not expose the endpoint until option 1 is implemented and tested; additionally enforce a no-redirect or revalidated-redirect policy in the fetch layer.

## 3. Scope and limitations

Reviewed the Express entry point, React Router entries/root, every production route loader/resource route, Openwhyd service, player/link/storage/theme helpers and components, application/test/mocks configuration, package metadata and lockfile, Docker/Fly/Vercel deployment files, and both workflow files. The full reviewed-file inventory is in the appendix.

No `.env*`, compose file, Dependabot/Renovate configuration, `.npmrc`, or source maps were tracked. `npm audit`, `npm audit --omit=dev`, and `npm outdated` were run successfully (their non-zero exits reflect reported audit/outdated results). Secret-pattern searches of the working tree and available Git history found no matches; history is shallow (two commits), so this cannot establish that older unreachable history is clean. No live production deployment, upstream service, DNS, or redirect behavior was tested.

## 4. Threat model

**Assets:** server network access, service availability, visitors' browser context, and third-party music metadata/stream URLs.  
**Trust boundaries:** browser → Express/SSR loaders → Openwhyd and Bandcamp; browser → third-party player/media providers.  
**Attackers:** anonymous visitors calling public loaders, malicious values hosted by upstream music services, and link senders directing users to attacker-controlled content.  
**Likely paths:** crafted Bandcamp query parameters causing server-side fetches, availability exhaustion through unrestricted upstream calls, and hostile/malformed upstream or locally tampered metadata reaching URLs/media UI.

## 5. Findings summary table

| ID | Title | Severity | OWASP | Fix difficulty | Changes app logic? | Location |
|---|---|---|---|---|---|---|
| SEC-001 | Bandcamp proxy allows SSRF | Medium | A10:2021 | Easy | Yes | `app/routes/api.bandcamp-track/route.ts:6-21` |
| SEC-002 | Missing browser security headers | Low | A05:2021 | Easy | Potentially | `server.js:22-47` |
| SEC-003 | Public upstream proxy has no abuse control | Low | A04:2021 | Easy | No | `server.js:47`; Bandcamp route |
| SEC-004 | Server-side upstream calls have no deadline | Low | A04:2021 | Easy | No | Bandcamp route; `app/services/openwhyd.ts` |
| SEC-005 | Raw external media URL paths are not constrained | Informational | A03:2021 | Medium | Potentially | `app/helpers/media-url.ts:18-21` |
| SEC-006 | Container build and runtime hardening gaps | Informational | A08:2021 | Easy | No | `Dockerfile:2,12-13,37-47` |
| SEC-007 | Upstream API data lacks runtime schema validation | Informational | A08:2021 | Medium | No | `app/services/openwhyd.ts` and route loaders |
| SEC-008 | Recent-playlist localStorage lacks schema validation | Informational | A08:2021 | Easy | No | `app/helpers/recent-playlists.ts:27-44` |
| SEC-009 | CI actions and formatter version are mutable | Informational | A08:2021 | Easy | No | workflow files |
| SEC-010 | Bandcamp route returns raw upstream errors | Low | A05:2021 | Trivial | No | `api.bandcamp-track/route.ts:40-44` |
| SEC-011 | Openwhyd URL builders do not encode input | Low | A03:2021 | Easy | No | `app/services/openwhyd.ts:11-75` |
| SEC-012 | HTTP listener lacks explicit server timeouts | Low | A05:2021 | Easy | Deployment-dependent | `server.js:49-51` |
| SEC-013 | Theme bootstrap applies unvalidated storage value | Informational | A08:2021 | Trivial | No | `theme-switcher.tsx:41-44` |

## 6. Detailed findings

### SEC-001 — Bandcamp proxy allows SSRF

- **Severity:** **Medium** — anonymous remote callers can cause requests to arbitrary HTTPS hosts reachable from the application network (approx. CVSS 3.1 `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L`). Severity becomes High if deployment permits a useful internal target, trusted internal TLS, redirects to one, or response exfiltration.
- **Classification:** OWASP Top 10 2021 A10: Server-Side Request Forgery; CWE-918.
- **Location:** `app/routes/api.bandcamp-track/route.ts:6-21` (16 lines).
- **Cause:** `artist` and `track` are only checked for presence, then interpolated into `trackUrl`: ``https://${artist}.bandcamp.com/track/${track}``. A value such as `artist=127.0.0.1/` makes the parsed host `127.0.0.1`; `bandcamp-fetch` receives that URL at line 21. Neither component is allowlisted and redirect behavior is not constrained here.
- **Impact / exploit scenario:** An attacker requests `/api/bandcamp-track?artist=127.0.0.1/&track=x`; the server, rather than the attacker, attempts an HTTPS request to `127.0.0.1`. Whether a useful internal service can be reached or its response disclosed needs deployment verification.
- **Fix difficulty:** Easy (<2 h), regression risk Medium.
- **Recommended fix (short):** Accept only a constrained Bandcamp artist slug and track slug; build the URL from validated components. Parse the final URL and require HTTPS plus a hostname matching an explicit `*.bandcamp.com` allowlist; reject IP literals, ports, separators, credentials, and redirect destinations that do not satisfy the same rule. Add tests for slash, `@`, encoded separators, IP, and redirect cases.
- **Changes app logic or visible behaviour?** Yes — malformed/non-Bandcamp identifiers will return 400 instead of attempting a lookup.
- **Confidence:** Confirmed for arbitrary HTTPS request construction; needs verification for internal-service reachability, redirect behavior, and response disclosure.
- **Evidence:** Code-path trace and URL parsing; `bandcamp-fetch` receives the constructed URL. No live network, redirect, or deployment test was performed.

### SEC-002 — Missing browser security headers

- **Severity:** **Low** — missing defense-in-depth makes browser compromise/clickjacking consequences worse if another flaw is introduced (approx. CVSS 3.1 `AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N`).
- **Classification:** OWASP Top 10 2021 A05: Security Misconfiguration; CWE-693.
- **Location:** `server.js:22-47` (26 lines); static inline theme script at `app/components/theme-switcher.tsx:36-47` (12 lines).
- **Cause:** Express disables `X-Powered-By` at line 27, but sets no CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame-ancestor/X-Frame-Options, COOP, CORP, or HSTS policy.
- **Impact / exploit scenario:** The application may be framed for clickjacking and has no CSP containment if a future HTML/DOM injection occurs; outgoing navigation can disclose fuller referrers than necessary.
- **Fix difficulty:** Easy (<2 h), regression risk Medium.
- **Recommended fix (short):** Set a tested header policy (for example Helmet configured for this app). Use a nonce or externalize the static theme bootstrap before enforcing CSP; tailor `script-src`, `connect-src`, `img-src`, `media-src`, and `frame-src` to React Player providers. Set HSTS only behind confirmed HTTPS termination.
- **Changes app logic or visible behaviour?** Potentially — CSP must permit required player/media origins.
- **Confidence:** Confirmed.
- **Evidence:** Direct inspection of all middleware registration in `server.js`; no header-setting middleware or route header policy exists.

### SEC-003 — Public upstream proxy has no abuse control

- **Severity:** **Low** — an unauthenticated attacker can repeatedly invoke third-party work and consume server/network capacity; risk compounds with SEC-001.
- **Classification:** OWASP Top 10 2021 A04: Insecure Design; CWE-770.
- **Location:** `server.js:47` (route catch-all) and `app/routes/api.bandcamp-track/route.ts:5-21` (17 lines).
- **Cause:** The endpoint is public and executes `bandcamp-fetch` per request. There is no rate limit, concurrency limit, cache keyed by validated input, or request-cost control. The 500 ms operation at line 20 is a delay, not throttling.
- **Impact / exploit scenario:** A client fans out requests with unique query strings, tying up outbound sockets and scraping capacity.
- **Fix difficulty:** Easy (<2 h), regression risk Low.
- **Recommended fix (short):** Apply a reverse-proxy or Express rate/concurrency limit to the resource route; add bounded caching after SEC-001 validation. Return 429 with a retry policy and set upstream connection limits.
- **Changes app logic or visible behaviour?** No, except abusive clients receive 429.
- **Confidence:** Confirmed.
- **Evidence:** Middleware and route code trace; no limiter/dependency/configuration was present.

### SEC-004 — Server-side upstream calls have no deadline

- **Severity:** **Low** — a stalled Openwhyd/Bandcamp connection can retain request capacity until platform defaults intervene.
- **Classification:** OWASP Top 10 2021 A04: Insecure Design; CWE-400.
- **Location:** `app/routes/api.bandcamp-track/route.ts:20-21`; `app/services/openwhyd.ts:108,126,144,169,181,209,215,221,256` (approximately 10 call sites).
- **Cause:** Calls use `fetch()`/`bcFetch.track.getInfo()` without an `AbortSignal` or timeout. `timeout500` delays before the Bandcamp request and does not bound it.
- **Impact / exploit scenario:** An upstream endpoint accepts a connection but never responds, exhausting worker/socket capacity under concurrent requests.
- **Fix difficulty:** Easy (<2 h), regression risk Low.
- **Recommended fix (short):** Use `AbortSignal.timeout()` (or a composed request signal) for each outbound request, abort on client disconnect where supported, and return a sanitized 502/504. Set a size/content-type limit before parsing responses where the client/library allows it.
- **Changes app logic or visible behaviour?** No, except stalled upstreams fail predictably.
- **Confidence:** Confirmed.
- **Evidence:** Direct inspection of each listed fetch call and the Bandcamp resource route.

### SEC-005 — Raw external media URL paths are not constrained

- **Severity:** **Informational** — only the Openwhyd `fi` service and unknown-service fallback return raw `eId`-derived values; the other recognized services construct fixed provider URL prefixes. No XSS was confirmed.
- **Classification:** OWASP Top 10 2021 A03: Injection; CWE-20.
- **Location:** `app/helpers/media-url.ts:18-21`; `app/components/table/tracks-table.tsx:80-86`; `app/components/music-player.tsx:193-231` (approximately 50 lines).
- **Cause:** The `fi` case returns `id` and the fallback returns `eId` directly; those values become link/player URLs without an HTTPS/provider-host allowlist. Other recognized services use fixed YouTube, SoundCloud, DailyMotion, Vimeo, or Bandcamp URL prefixes.
- **Impact / exploit scenario:** A malicious Openwhyd record using `fi` or an unknown service may cause navigation or playback attempts to an arbitrary client-side URL, exposing a visitor's IP/user agent to an attacker-controlled HTTPS host.
- **Fix difficulty:** Medium (<1 day), regression risk Medium.
- **Recommended fix (short):** Parse URLs and allow only HTTPS plus required provider hosts before linking or passing a URL to React Player/audio. Define intended provider support explicitly and reject/skip unsupported records.
- **Changes app logic or visible behaviour?** Potentially — unsupported tracks no longer open/play.
- **Confidence:** Confirmed for arbitrary URL propagation; needs verification for browser `javascript:` handling and React Player provider behavior before treating it as XSS.
- **Evidence:** Data-flow trace from typed Openwhyd track data through `media-url` into link/player sinks; links include `rel="noopener noreferrer"` and React escapes rendered text.

### SEC-006 — Container build and runtime hardening gaps

- **Severity:** **Informational** — these are defense-in-depth and reproducibility gaps; no container compromise was demonstrated.
- **Classification:** OWASP Top 10 2021 A08: Software and Data Integrity Failures; CWE-250/CWE-1188.
- **Location:** `Dockerfile:2,12-13,37-47` (approximately 12 lines).
- **Cause:** The base image is a mutable tag, dependencies use `npm install` rather than lockfile-enforcing `npm ci`, and the final stage has no non-root `USER`.
- **Impact / exploit scenario:** A compromised process can access container resources as root; a changed base tag or install resolution can change build inputs unexpectedly.
- **Fix difficulty:** Easy (<2 h), regression risk Low.
- **Recommended fix (short):** Pin the Node base image by digest, run `npm ci`, copy only production artifacts/dependencies into the final stage, and run under a dedicated unprivileged UID/GID.
- **Changes app logic or visible behaviour?** No.
- **Confidence:** Confirmed.
- **Evidence:** Dockerfile inspection. This is defense-in-depth; no container compromise was demonstrated.

### SEC-007 — Upstream API data lacks runtime schema validation

- **Severity:** **Informational** — malformed or hostile Openwhyd responses can reach UI/media sinks, though a direct injection was not confirmed.
- **Classification:** OWASP Top 10 2021 A08: Software and Data Integrity Failures; CWE-20.
- **Location:** `app/services/openwhyd.ts:110,128,151,171,183,241,258`; `app/routes/_player.exploring.$query/route.tsx:22-33` (approximately 25 lines).
- **Cause:** JSON is asserted with TypeScript casts such as `as Track[]` rather than checked at runtime; route data is therefore trusted by the renderer.
- **Impact / exploit scenario:** A changed or malicious upstream response can break rendering or feed unexpected strings into media/link behavior.
- **Fix difficulty:** Medium (<1 day), regression risk Low.
- **Recommended fix (short):** Validate response envelopes and track fields at the service boundary with a runtime schema and discard/normalize invalid fields before returning loader data.
- **Changes app logic or visible behaviour?** No for conforming upstream data.
- **Confidence:** Confirmed.
- **Evidence:** Inspection of response parsing and route consumption. React JSX escapes text; this is not a confirmed XSS.

### SEC-008 — Recent-playlist localStorage lacks schema validation

- **Severity:** **Informational** — locally tampered data can affect rendering/navigation but does not carry authorization or secret data.
- **Classification:** OWASP Top 10 2021 A08: Software and Data Integrity Failures; CWE-20.
- **Location:** `app/helpers/recent-playlists.ts:27-31,41-44`; `app/components/playlists.tsx:123-140`; `app/components/playlist-scroll-area.tsx:60-68` (approximately 30 lines).
- **Cause:** `JSON.parse` results are returned without verifying array/object/string fields or bounding length before later use.
- **Impact / exploit scenario:** A user/extension that writes oversized or malformed localStorage can cause client exceptions or unexpected playlist links.
- **Fix difficulty:** Easy (<2 h), regression risk Low.
- **Recommended fix (short):** Parse inside `try/catch`, validate a bounded array of expected primitive fields, reject prototype-like keys, and fall back to an empty list.
- **Changes app logic or visible behaviour?** No for valid stored data.
- **Confidence:** Confirmed.
- **Evidence:** Storage helper and consuming components inspected; the stored values are public metadata only.

### SEC-009 — CI actions and formatter version are mutable

- **Severity:** **Informational** — tag movement can change CI code without an in-repository review; no privileged `pull_request_target` workflow was found.
- **Classification:** OWASP Top 10 2021 A08: Software and Data Integrity Failures; CWE-829.
- **Location:** `.github/workflows/code_quality.yaml:12-16`; `.github/workflows/codeql.yml:58,62,90` (approximately 10 lines).
- **Cause:** GitHub Actions are referenced by mutable major tags (`@v4`, `@v3`, `@v2`), and Biome is requested as `latest`.
- **Impact / exploit scenario:** A compromised or changed action/tag affects CI execution on future workflow runs.
- **Fix difficulty:** Easy (<2 h), regression risk Low.
- **Recommended fix (short):** Pin third-party and official action references to reviewed commit SHAs and pin the Biome version; use Dependabot to maintain those pins.
- **Changes app logic or visible behaviour?** No.
- **Confidence:** Confirmed.
- **Evidence:** Workflow inspection. Workflows use `pull_request`, not `pull_request_target`, and no untrusted PR content was found executing with secrets.

### SEC-010 — Bandcamp route returns raw upstream errors

- **Severity:** **Low** — exception messages from a server-side request are returned to any caller and can disclose internal URL/host or library/network details, particularly when combined with SEC-001.
- **Classification:** OWASP Top 10 2021 A05: Security Misconfiguration; CWE-209.
- **Location:** `app/routes/api.bandcamp-track/route.ts:40-44` (6 lines).
- **Cause:** The catch block serializes `err.message` directly in a 500 response.
- **Impact / exploit scenario:** A request that makes `bandcamp-fetch` fail against a reachable internal host can return its error text to the attacker, helping target discovery or exploitation.
- **Fix difficulty:** Trivial (<15 min), regression risk Low.
- **Recommended fix (short):** Log detailed errors server-side with structured context, and return a fixed generic 502/500 response message to clients.
- **Changes app logic or visible behaviour?** No, except clients no longer receive internal error details.
- **Confidence:** Confirmed.
- **Evidence:** Direct inspection of the route catch block.

### SEC-011 — Openwhyd URL builders do not encode input

- **Severity:** **Low** — untrusted route/search values can alter paths and query strings sent to the fixed Openwhyd origin; this is not SSRF because the hostname is constant.
- **Classification:** OWASP Top 10 2021 A03: Injection; CWE-20.
- **Location:** `app/services/openwhyd.ts:11-75` (65 lines), consumed by dynamic route loaders including `app/routes/_player.exploring.$query/route.tsx:18-34` and `app/routes/_player.user/route.tsx:14-33`.
- **Cause:** URL values are interpolated directly into path and query-string templates, for example `search?q=${query}` and `/u/${userId}/playlist/${playlistId}`, rather than encoded components or `URLSearchParams`.
- **Impact / exploit scenario:** A crafted search, user, playlist, or pagination value containing separators such as `&`, `?`, `#`, or `/` changes the Openwhyd request's interpretation and can produce unexpected upstream queries or routes.
- **Fix difficulty:** Easy (<2 h), regression risk Low.
- **Recommended fix (short):** Build endpoints with `URL` and `URLSearchParams`, encode path segments with `encodeURIComponent`, and validate expected identifier formats before constructing requests. Add tests for delimiters, encoded slashes, and fragment/query injection.
- **Changes app logic or visible behaviour?** No for valid identifiers and searches; malformed values will no longer alter upstream URL structure.
- **Confidence:** Confirmed.
- **Evidence:** Direct inspection of URL builders and their dynamic route consumers.

### SEC-012 — HTTP listener lacks explicit server timeouts

- **Severity:** **Low** — deployment defaults control how long slow clients can retain HTTP connections; this can amplify availability pressure.
- **Classification:** OWASP Top 10 2021 A05: Security Misconfiguration; CWE-400.
- **Location:** `server.js:49-51` (3 lines).
- **Cause:** The app calls `app.listen()` without setting `headersTimeout`, `requestTimeout`, or `keepAliveTimeout`; it also does not read a `HOST` setting, so the bind address is Node's unspecified default.
- **Impact / exploit scenario:** A slow client can hold partial headers/connections until runtime or platform defaults expire. Exposure depends on the deployment proxy and Node defaults.
- **Fix difficulty:** Easy (<2 h), regression risk Low.
- **Recommended fix (short):** Create/configure the HTTP server with explicit header, request, and keep-alive timeouts aligned with the reverse proxy. Deliberately configure the bind host and document the expected proxy/network boundary.
- **Changes app logic or visible behaviour?** Deployment-dependent — unusually slow requests may time out sooner.
- **Confidence:** Confirmed for absent explicit configuration; needs verification for actual production exposure.
- **Evidence:** Direct inspection of listener setup; Fly configuration supplies connection limits but not Node's HTTP-parser/request timeouts.

### SEC-013 — Theme bootstrap applies unvalidated storage value

- **Severity:** **Informational** — a locally modified theme value is assigned to an HTML attribute before normal theme validation, but it is not an HTML/script injection sink.
- **Classification:** OWASP Top 10 2021 A08: Software and Data Integrity Failures; CWE-20.
- **Location:** `app/components/theme-switcher.tsx:41-44` (4 lines); later validation at `app/components/theme-switcher.tsx:56-59,81-89`.
- **Cause:** The inline pre-hydration script reads `localStorage.theme` and passes it directly to `setAttribute("data-theme", theme)`. `validateTheme()` is used only later by `getTheme()` and `setTheme()`.
- **Impact / exploit scenario:** A browser extension or local user can set an unexpected attribute value, producing at most unintended CSS selector matching or visual state until client code normalizes it.
- **Fix difficulty:** Trivial (<15 min), regression risk Low.
- **Recommended fix (short):** Repeat the small fixed allowlist in the bootstrap script before setting the attribute, or move the allowed theme values into a shared static constant.
- **Changes app logic or visible behaviour?** No for supported theme values.
- **Confidence:** Confirmed.
- **Evidence:** Direct control-flow trace of the inline script and `validateTheme`.

## 7. Dependency audit results

| Package / chain | Result | Reachability / notes |
|---|---|---|
| `postcss-selector-parser <7.1.6` via `@tailwindcss/typography` | Moderate, GHSA-rj75-hqrm-r3gf; CVSS 5.9 (`AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H`) | Reported by full `npm audit`; build/dev dependency only. `npm audit --omit=dev` reported 0 vulnerabilities, so it is not in the production dependency set. Audit proposes a major downgrade/change to `@tailwindcss/typography@0.5.4`; verify manually rather than applying automatically. |
| Production dependency set | No known advisories | `npm audit --omit=dev --json` completed with 0 vulnerabilities. |
| `react-player` 2.16.1 / `vite-env-only` 2.4.1 | Outdated major versions available | `npm outdated` reports newer majors, not a vulnerability finding. Review migrations and provider/CSP behavior before upgrading. |
| `bandcamp-fetch` 3.2.1 | No advisory reported | High-risk role because it fetches remote scraped content; SEC-001 must validate input before calling it. |

The committed `package-lock.json` includes integrity metadata. Packages use caret ranges in `package.json`; no `.npmrc` with `engine-strict` was found. `package.json` has no `postinstall` or `prepare` hook. `engines.node` is declared as `>=22.12.0`, but enforcement depends on the installer/runtime because `engine-strict` is absent.

## 8. What is already done well

- `X-Powered-By` is disabled (`server.js:27`).
- Openwhyd uses a fixed HTTPS base host, so dynamic segments do not select an arbitrary outbound host.
- React JSX escaping is relied on rather than dangerous HTML rendering; no `dangerouslySetInnerHTML`, `eval`, `new Function`, or `document.write` was found.
- External links reviewed use `rel="noopener noreferrer"`.
- The theme bootstrap script is static rather than data-derived; normal application theme reads use a fixed allowlist (SEC-013 notes the pre-hydration exception).
- There are no authentication cookies, sessions, state-changing actions, permissive CORS rules, or committed secrets in the inspected tree/history.
- Production audit is clean; CI uses `pull_request` rather than `pull_request_target`.

## 9. Appendix: files reviewed

`server.js`; `app/entry.server.tsx`; `app/entry.client.tsx`; `app/root.tsx`; `app/routes.ts`; `app/services/openwhyd.ts`; `app/config.shared.ts`; `app/helpers/{apiplaylist-helpers,media-url,mute-adapter,recent-playlists,timeouts}.ts`; `app/components/{BandcampPlayer,captioned-image,duration,header,item-cover,music-player,navbar-button,playlist-scroll-area,playlists,theme-switcher,theme-switcher-button,use-bandcamp-track,use-music-player,user-link}.tsx`/`.ts`; all `app/components/table/*`; all `app/components/ui/*`; all `app/routes/**/route.tsx`; `app/routes/healthcheck.ts`; all `app/**/*.test.{ts,tsx}`; `app/mocks/{handlers,server}.ts`; `app/test/setup.ts`; all `app/types/*`; `package.json`; `package-lock.json`; `tsconfig.json`; `biome.json`; `vite.config.ts`; `react-router.config.ts`; `tailwind.config.cjs`; `components.json`; `.gitignore`; `.dockerignore`; `Dockerfile`; `fly.toml`; `vercel.json`; `.github/workflows/{code_quality.yaml,codeql.yml}`; `.vscode/*`; `public/favicon.ico`; `README.md`; `testing-strategy.md`; and tracked image/screenshot assets.

The following expected categories were absent from the tracked tree: `.env*`, `docker-compose*`, `.npmrc`, Dependabot/Renovate configuration, and deployment configurations other than Fly/Vercel.

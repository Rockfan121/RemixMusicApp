# Security report

## 1. Executive summary

Security posture: **not safe to expose publicly until the High-severity SSRF is fixed**.
One public resource route turns attacker-controlled input into the hostname of a server-side request.
The server also lacks a browser-security-header policy, outbound request deadlines, and abuse controls.
Openwhyd, Bandcamp, and localStorage data are largely trusted by type assertion rather than runtime validation.
No committed secrets were found in the working tree or available Git history.
`npm audit --omit=dev` found no production dependency advisories; the full audit found one dev-only advisory chain.
Findings: **Critical 0, High 1, Medium 0, Low 5, Informational 3**.

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
| SEC-001 | Bandcamp proxy allows SSRF | High | A10:2021 | Easy | Yes | `app/routes/api.bandcamp-track/route.ts:6-21` |
| SEC-002 | Missing browser security headers | Low | A05:2021 | Easy | Potentially | `server.js:22-47` |
| SEC-003 | Public upstream proxy has no abuse control | Low | A04:2021 | Easy | No | `server.js:47`; Bandcamp route |
| SEC-004 | Server-side upstream calls have no deadline | Low | A04:2021 | Easy | No | Bandcamp route; `app/services/openwhyd.ts` |
| SEC-005 | External media URLs are not constrained | Low | A03:2021 | Medium | Potentially | media helper/player/table |
| SEC-006 | Container build and runtime hardening gaps | Low | A08:2021 | Easy | No | `Dockerfile:2,12-13,37-47` |
| SEC-007 | Upstream API data lacks runtime schema validation | Informational | A08:2021 | Medium | No | `app/services/openwhyd.ts` and route loaders |
| SEC-008 | Recent-playlist localStorage lacks schema validation | Informational | A08:2021 | Easy | No | `app/helpers/recent-playlists.ts:27-44` |
| SEC-009 | CI actions and formatter version are mutable | Informational | A08:2021 | Easy | No | workflow files |

## 6. Detailed findings

### SEC-001 — Bandcamp proxy allows SSRF

- **Severity:** **High** — anonymous remote callers can cause requests to hosts reachable from the application network; impact depends on network egress and internal services (approx. CVSS 3.1 `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:L`).
- **Classification:** OWASP Top 10 2021 A10: Server-Side Request Forgery; CWE-918.
- **Location:** `app/routes/api.bandcamp-track/route.ts:6-21` (16 lines).
- **Cause:** `artist` and `track` are only checked for presence, then interpolated into `trackUrl`: ``https://${artist}.bandcamp.com/track/${track}``. A value such as `artist=127.0.0.1/` makes the parsed host `127.0.0.1`; `bandcamp-fetch` receives that URL at line 21. Neither component is allowlisted and redirect behavior is not constrained here.
- **Impact / exploit scenario:** An attacker requests `/api/bandcamp-track?artist=127.0.0.1/&track=x`; the server, rather than the attacker, attempts an HTTPS request to `127.0.0.1`, potentially probing an internal admin/metadata service.
- **Fix difficulty:** Easy (<2 h), regression risk Medium.
- **Recommended fix (short):** Accept only a constrained Bandcamp artist slug and track slug; build the URL from validated components. Parse the final URL and require HTTPS plus a hostname matching an explicit `*.bandcamp.com` allowlist; reject IP literals, ports, separators, credentials, and redirect destinations that do not satisfy the same rule. Add tests for slash, `@`, encoded separators, IP, and redirect cases.
- **Changes app logic or visible behaviour?** Yes — malformed/non-Bandcamp identifiers will return 400 instead of attempting a lookup.
- **Confidence:** Confirmed.
- **Evidence:** Code-path trace and URL parsing; security specialist verified that `bandcamp-fetch` receives and fetches the supplied URL.

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

### SEC-005 — External media URLs are not constrained

- **Severity:** **Low** — hostile upstream `eId` can direct visitors/embedded player code to arbitrary client-side resources; no authenticated state was found, reducing current impact.
- **Classification:** OWASP Top 10 2021 A03: Injection; CWE-20.
- **Location:** `app/helpers/media-url.ts:3-22`; `app/components/table/tracks-table.tsx:80-86`; `app/components/music-player.tsx:193-231` (approximately 65 lines).
- **Cause:** Upstream media identifiers become link/player URLs without an HTTPS/provider-host allowlist. Links use `rel="noopener noreferrer"`, and no confirmed `javascript:` execution sink was found.
- **Impact / exploit scenario:** A malicious Openwhyd record may cause playback/navigation attempts to an attacker-controlled media host, exposing a visitor's IP/user agent and enabling provider-specific embed risks.
- **Fix difficulty:** Medium (<1 day), regression risk Medium.
- **Recommended fix (short):** Parse URLs and allow only HTTPS plus required provider hosts before linking or passing a URL to React Player/audio. Define intended provider support explicitly and reject/skip unsupported records.
- **Changes app logic or visible behaviour?** Potentially — unsupported tracks no longer open/play.
- **Confidence:** Likely.
- **Evidence:** Data-flow trace from typed Openwhyd track data through `media-url` into link/player sinks; React text rendering itself is escaped.

### SEC-006 — Container build and runtime hardening gaps

- **Severity:** **Low** — a container compromise has broader impact because the final process runs as root; mutable inputs weaken reproducibility.
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
- Theme values are allowlisted before DOM use; the bootstrap script is static rather than data-derived.
- There are no authentication cookies, sessions, state-changing actions, permissive CORS rules, or committed secrets in the inspected tree/history.
- Production audit is clean; CI uses `pull_request` rather than `pull_request_target`.

## 9. Appendix: files reviewed

`server.js`; `app/entry.server.tsx`; `app/entry.client.tsx`; `app/root.tsx`; `app/routes.ts`; `app/services/openwhyd.ts`; `app/config.shared.ts`; `app/helpers/{apiplaylist-helpers,media-url,mute-adapter,recent-playlists,timeouts}.ts`; `app/components/{BandcampPlayer,captioned-image,duration,header,item-cover,music-player,navbar-button,playlist-scroll-area,playlists,theme-switcher,theme-switcher-button,use-bandcamp-track,use-music-player,user-link}.tsx`/`.ts`; all `app/components/table/*`; all `app/components/ui/*`; all `app/routes/**/route.tsx`; `app/routes/healthcheck.ts`; all `app/**/*.test.{ts,tsx}`; `app/mocks/{handlers,server}.ts`; `app/test/setup.ts`; all `app/types/*`; `package.json`; `package-lock.json`; `tsconfig.json`; `biome.json`; `vite.config.ts`; `react-router.config.ts`; `tailwind.config.cjs`; `components.json`; `.gitignore`; `.dockerignore`; `Dockerfile`; `fly.toml`; `vercel.json`; `.github/workflows/{code_quality.yaml,codeql.yml}`; `.vscode/*`; `public/favicon.ico`; `README.md`; `testing-strategy.md`; and tracked image/screenshot assets.

The following expected categories were absent from the tracked tree: `.env*`, `docker-compose*`, `.npmrc`, Dependabot/Renovate configuration, and deployment configurations other than Fly/Vercel.

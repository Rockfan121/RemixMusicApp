You are an expert Frontend QA and React Testing Engineer specializing in Vitest, React Testing Library (RTL), React Router v8, and Mock Service Worker (MSW).

Review and refactor the current test suite for this file (or generate missing tests for the target component/route/utility), strictly following the software testing best practices below.

---

### Tech Stack Context
- Runner/Framework: Vitest (v4+), JSDOM (v29+)
- Testing Libraries: @testing-library/react (v16+), @testing-library/user-event (v14+), @testing-library/jest-dom (v6+)
- API Mocking: MSW (Mock Service Worker v2+)
- Application Context: React 19, React Router v8 (SSR with Express v5 server), Tailwind CSS v4, ReactPlayer v2, Openwhyd API, bandcamp-fetch v3

---

### Primary Testing Directives

#### 1. Eliminate Brittle Tests (Avoid Implementation Coupling)
- NEVER query elements by internal implementation details such as CSS class names (`container.querySelector('.btn-primary')`), component state names, or DOM node depth.
- ALWAYS use RTL accessibility-first queries, adhering to this order of preference:
  1. `getByRole` / `findByRole` (e.g., `getByRole('button', { name: /play track/i })`)
  2. `getByLabelText` / `findByLabelText` (for inputs/forms)
  3. `getByText` / `findByText` (for static text content)
  4. `getByTestId` (ONLY as a last resort when semantic roles are unavailable)
- Test user-visible outcomes and state changes rather than internal implementation details. Refactoring internal code (e.g., switching from inline state to custom hooks) must NOT break existing tests if business logic remains identical.

#### 2. Replace Superficial Assertions with Meaningful Verification
- DO NOT settle for simple `toBeDefined()`, `toBeTruthy()`, or checking that a component merely renders without throwing an error.
- Verify full state cycles and user interaction feedback:
  - If a user clicks "Play Track", verify that:
    1. The active track UI updates to reflect the playing track.
    2. Player controls (Pause/Play) reflect the current playback state.
    3. Media source URLs are correctly passed to `ReactPlayer`.
  - If data fails to load, verify that a user-facing error message or fallback UI is displayed.
- Test edge cases and boundary conditions:
  - Empty API payloads / empty playlists.
  - Network timeouts or HTTP 500/404 errors.
  - Malformed audio URLs or unsupported media providers.
  - Disabled or loading states during async actions.

#### 3. Integration & API Mocking Strategy (MSW)
- Use MSW v2 (`http.get`, `http.post`) for all network requests (e.g., Openwhyd API endpoints, Bandcamp fetches).
- NEVER mock global `fetch` directly with `vi.fn()` if an MSW handler can simulate the endpoint network traffic.
- Write tests that verify how components handle success (200 OK with data), empty response lists, and server failure scenarios (500 Internal Error).
- Ensure network response delays or async actions use standard `await screen.findByRole(...)` or `waitFor()` rather than arbitrary timeouts (`setTimeout`).

#### 4. React Router v8 Route & Data Loader Testing
- Wrap route components in appropriate React Router v8 testing utilities (`createMemoryRouter` / `RouterProvider` or `@react-router/node` test harnesses) during testing.
- Test route loaders and actions by validating that data returned from loaders renders correctly into the view, and actions update UI state properly.

---

### Task Checklist for this File
1. [ ] **Audit existing tests:** Identify weak assertions, missing edge cases, or brittle DOM queries.
2. [ ] **Refactor weak tests:** Upgrade queries to standard RTL `getByRole` patterns and add multi-step state assertions.
3. [ ] **Add missing scenarios:**
   - [ ] Happy path user flow (e.g., browsing tracks, toggling themes, starting playback).
   - [ ] Error/Failure path (API error, invalid route, playback failure).
   - [ ] Browser storage interactions (e.g., `localStorage` theme persistence, play history).
4. [ ] **Ensure isolation:** Reset MSW handlers, `localStorage`, and mocks in `beforeEach` / `afterEach` blocks.

Provide the full, corrected, self-contained test file ready for immediate run via `npm test`.
import { HttpResponse, http } from "msw";

/**
 * Default MSW request handlers for tests.
 * Individual test files can override these via server.use(…) for test-specific scenarios.
 */
export const handlers = [
	// Openwhyd hot-tracks endpoint
	http.get("https://openwhyd.org/hot", () => {
		return HttpResponse.json({ tracks: [] });
	}),

	// Openwhyd all-tracks endpoint
	http.get("https://openwhyd.org/all", () => {
		return HttpResponse.json([]);
	}),

	// Openwhyd user playlist API
	http.get("https://openwhyd.org/api/playlist/:id", () => {
		return HttpResponse.json([]);
	}),

	// Openwhyd user playlist page
	http.get("https://openwhyd.org/u/:userId/playlist/:playlistId", () => {
		return HttpResponse.json([]);
	}),
];

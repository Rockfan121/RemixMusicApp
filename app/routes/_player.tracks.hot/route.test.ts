// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { MAX_FETCHED_ITEMS } from "@/config.shared";
import { server } from "@/mocks/server";

// The loader calls `await new Promise(timeout300)` before fetching.
// We mock the helper so tests run instantly.
vi.mock("@/helpers/timeouts", () => ({
	timeout300: (r: (value: unknown) => void) => r(undefined),
}));

import { loader } from "./route";

function makeRequest(params: Record<string, string> = {}) {
	const url = new URL("http://localhost/tracks/hot");
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}
	return new Request(url.toString());
}

function makeTracks(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		_id: `id_${i}`,
		name: `Track ${i}`,
		eId: `/yt/id${i}`,
	}));
}

describe("hot-tracks loader", () => {
	it("returns TRACKS and hasMore=false when the API returns fewer than MAX_FETCHED_ITEMS tracks", async () => {
		const tracks = makeTracks(5);
		server.use(
			http.get("https://openwhyd.org/hot", () => HttpResponse.json({ tracks })),
		);

		const res = await loader({
			request: makeRequest(),
			params: {},
			context: {},
		});
		expect(res.TRACKS).toEqual({ tracks });
		expect(res.hasMore).toBe(false);
	});

	it("returns hasMore=true when the API returns exactly MAX_FETCHED_ITEMS tracks", async () => {
		const tracks = makeTracks(MAX_FETCHED_ITEMS);
		server.use(
			http.get("https://openwhyd.org/hot", () => HttpResponse.json({ tracks })),
		);

		const res = await loader({
			request: makeRequest(),
			params: {},
			context: {},
		});
		expect(res.hasMore).toBe(true);
	});

	it("passes the skip query parameter to the Openwhyd API", async () => {
		let receivedSkip: string | null = null;
		server.use(
			http.get("https://openwhyd.org/hot", ({ request }) => {
				receivedSkip = new URL(request.url).searchParams.get("skip");
				return HttpResponse.json({ tracks: [] });
			}),
		);

		await loader({
			request: makeRequest({ skip: "50" }),
			params: {},
			context: {},
		});
		expect(receivedSkip).toBe("50");
	});

	it("returns empty TRACKS and hasMore=false when the API responds with a non-200 status", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/hot",
				() => new HttpResponse(null, { status: 503 }),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: {},
			context: {},
		});
		expect(res.TRACKS).toEqual({});
		expect(res.hasMore).toBe(false);
	});

	it("returns hasMore=false when the API response has no tracks array", async () => {
		server.use(
			http.get("https://openwhyd.org/hot", () => HttpResponse.json({})),
		);

		const res = await loader({
			request: makeRequest(),
			params: {},
			context: {},
		});
		expect(res.hasMore).toBe(false);
	});
});

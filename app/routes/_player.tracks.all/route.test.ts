// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { MAX_FETCHED_ITEMS } from "@/config.shared";
import { server } from "@/mocks/server";

vi.mock("@/helpers/timeouts", () => ({
	timeout300: (r: (value: unknown) => void) => r(undefined),
}));

import { loader } from "./route";

function makeRequest(params: Record<string, string> = {}) {
	const url = new URL("http://localhost/tracks/all");
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

describe("all-tracks loader", () => {
	it("returns TRACKS and hasMore=false when the API returns fewer than MAX_FETCHED_ITEMS tracks", async () => {
		const tracks = makeTracks(5);
		server.use(
			http.get("https://openwhyd.org/all", () => HttpResponse.json(tracks)),
		);

		const res = await loader({
			request: makeRequest(),
			params: {},
			context: {},
		});
		expect(res.TRACKS).toEqual(tracks);
		expect(res.hasMore).toBe(false);
	});

	it("returns hasMore=true when the API returns exactly MAX_FETCHED_ITEMS tracks", async () => {
		const tracks = makeTracks(MAX_FETCHED_ITEMS);
		server.use(
			http.get("https://openwhyd.org/all", () => HttpResponse.json(tracks)),
		);

		const res = await loader({
			request: makeRequest(),
			params: {},
			context: {},
		});
		expect(res.hasMore).toBe(true);
	});

	it("passes the after query parameter to the Openwhyd API", async () => {
		let receivedAfter: string | null = null;
		server.use(
			http.get("https://openwhyd.org/all", ({ request }) => {
				receivedAfter = new URL(request.url).searchParams.get("after");
				return HttpResponse.json([]);
			}),
		);

		await loader({
			request: makeRequest({ after: "abc123" }),
			params: {},
			context: {},
		});
		expect(receivedAfter).toBe("abc123");
	});

	it("returns empty TRACKS and hasMore=false when the API responds with a non-200 status", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/all",
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
});

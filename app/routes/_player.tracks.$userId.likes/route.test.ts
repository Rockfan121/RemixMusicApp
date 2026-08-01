// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/mocks/server";

vi.mock("@/helpers/timeouts", () => ({
	timeout300: (r: (value: unknown) => void) => r(undefined),
}));

import { loader } from "./route";

const USER_ID = "abc123";
const USER_INFO = { id: USER_ID, name: "testuser", nbPosts: 10, nbLikes: 5 };

function makeRequest(params: Record<string, string> = {}) {
	const url = new URL(`http://localhost/tracks/${USER_ID}/likes`);
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

describe("user-likes loader", () => {
	it("returns null playlistInfo and empty TRACKS when the user is not found", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/api/user/:userId",
				() => new HttpResponse(null, { status: 404 }),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: { userId: USER_ID },
			context: {},
		});
		expect(res.playlistInfo).toBeNull();
		expect(res.TRACKS).toEqual([]);
		expect(res.hasMore).toBe(false);
	});

	it("returns playlistInfo and TRACKS when the user exists", async () => {
		const tracks = makeTracks(3);
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
			http.get("https://openwhyd.org/u/:userId/likes", () =>
				HttpResponse.json(tracks),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: { userId: USER_ID },
			context: {},
		});
		expect(res.playlistInfo).not.toBeNull();
		expect(res.playlistInfo?.uNm).toBe("testuser");
		expect(res.TRACKS).toEqual(tracks);
		expect(res.hasMore).toBe(false);
	});

	// The likes endpoint uses hasMoreLimit = 21
	it("returns hasMore=true when the API returns exactly 21 tracks", async () => {
		const tracks = makeTracks(21);
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
			http.get("https://openwhyd.org/u/:userId/likes", () =>
				HttpResponse.json(tracks),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: { userId: USER_ID },
			context: {},
		});
		expect(res.hasMore).toBe(true);
	});

	it("passes the after parameter to the likes endpoint", async () => {
		let receivedAfter: string | null = null;
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
			http.get("https://openwhyd.org/u/:userId/likes", ({ request }) => {
				receivedAfter = new URL(request.url).searchParams.get("after");
				return HttpResponse.json([]);
			}),
		);

		await loader({
			request: makeRequest({ after: "xyz789" }),
			params: { userId: USER_ID },
			context: {},
		});
		expect(receivedAfter).toBe("xyz789");
	});

	it("returns empty TRACKS and hasMore=false when the likes endpoint fails", async () => {
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
			http.get(
				"https://openwhyd.org/u/:userId/likes",
				() => new HttpResponse(null, { status: 503 }),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: { userId: USER_ID },
			context: {},
		});
		expect(res.TRACKS).toEqual([]);
		expect(res.hasMore).toBe(false);
	});
});

// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { MAX_FETCHED_ITEMS } from "@/config.shared";
import { server } from "@/mocks/server";

// The loader calls `await new Promise(timeout300)` twice before fetching.
vi.mock("@/helpers/timeouts", () => ({
	timeout300: (r: (value: unknown) => void) => r(undefined),
}));

import { loader } from "./route";

const USER_ID = "abc123";
const PLAYLIST_ID = "5";
const PLAYLIST_INFO = [
	{
		id: `${USER_ID}_${PLAYLIST_ID}`,
		name: "My Playlist",
		uId: USER_ID,
		uNm: "testuser",
		plId: PLAYLIST_ID,
		nbTracks: 10,
	},
];

function makeRequest(params: Record<string, string> = {}) {
	const url = new URL(`http://localhost/tracks/${USER_ID}/${PLAYLIST_ID}`);
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

describe("playlist loader", () => {
	it("returns empty PLAYLIST_INFO and TRACKS when the playlist API returns non-200", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/api/playlist/:id",
				() => new HttpResponse(null, { status: 404 }),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: { userId: USER_ID, playlistId: PLAYLIST_ID },
			context: {},
		});
		expect(res.PLAYLIST_INFO).toEqual([]);
		expect(res.TRACKS).toEqual([]);
		expect(res.hasMore).toBe(false);
	});

	it("returns PLAYLIST_INFO and TRACKS on success", async () => {
		const tracks = makeTracks(3);
		server.use(
			http.get("https://openwhyd.org/api/playlist/:id", () =>
				HttpResponse.json(PLAYLIST_INFO),
			),
			http.get("https://openwhyd.org/u/:userId/playlist/:playlistId", () =>
				HttpResponse.json(tracks),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: { userId: USER_ID, playlistId: PLAYLIST_ID },
			context: {},
		});
		expect(res.PLAYLIST_INFO).toEqual(PLAYLIST_INFO);
		expect(res.TRACKS).toEqual(tracks);
		expect(res.hasMore).toBe(false);
	});

	it("returns hasMore=true when the API returns MAX_FETCHED_ITEMS tracks", async () => {
		const tracks = makeTracks(MAX_FETCHED_ITEMS);
		server.use(
			http.get("https://openwhyd.org/api/playlist/:id", () =>
				HttpResponse.json(PLAYLIST_INFO),
			),
			http.get("https://openwhyd.org/u/:userId/playlist/:playlistId", () =>
				HttpResponse.json(tracks),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: { userId: USER_ID, playlistId: PLAYLIST_ID },
			context: {},
		});
		expect(res.hasMore).toBe(true);
	});

	it("returns empty TRACKS when the user playlist endpoint returns 'moved' text", async () => {
		server.use(
			http.get("https://openwhyd.org/api/playlist/:id", () =>
				HttpResponse.json(PLAYLIST_INFO),
			),
			http.get(
				"https://openwhyd.org/u/:userId/playlist/:playlistId",
				() => new HttpResponse("moved to /some-other-page", { status: 200 }),
			),
		);

		const res = await loader({
			request: makeRequest(),
			params: { userId: USER_ID, playlistId: PLAYLIST_ID },
			context: {},
		});
		expect(res.PLAYLIST_INFO).toEqual(PLAYLIST_INFO);
		expect(res.TRACKS).toEqual([]);
		expect(res.hasMore).toBe(false);
	});

	it("passes the after parameter to the tracks endpoint", async () => {
		let receivedAfter: string | null = null;
		server.use(
			http.get("https://openwhyd.org/api/playlist/:id", () =>
				HttpResponse.json(PLAYLIST_INFO),
			),
			http.get(
				"https://openwhyd.org/u/:userId/playlist/:playlistId",
				({ request }) => {
					receivedAfter = new URL(request.url).searchParams.get("after");
					return HttpResponse.json([]);
				},
			),
		);

		await loader({
			request: makeRequest({ after: "abc123" }),
			params: { userId: USER_ID, playlistId: PLAYLIST_ID },
			context: {},
		});
		expect(receivedAfter).toBe("abc123");
	});
});

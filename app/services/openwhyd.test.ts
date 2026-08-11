// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { MAX_FETCHED_ITEMS, MAX_PLAYLISTS } from "@/config.shared";
import { server } from "@/mocks/server";
import {
	allPlaylist,
	apiPlaylist,
	apiUser,
	fetchAllPlaylist,
	fetchApiPlaylist,
	fetchHotPlaylist,
	fetchUserInfo,
	fetchUserListOfPlaylists,
	fetchUserPlaylist,
	fetchUserSpecialPlaylist,
	hotPlaylist,
	playlistImg,
	search,
	userAllPlaylist,
	userImg,
	userLikesPlaylist,
	userListOfPlaylists,
	userPlaylist,
	userStreamPlaylist,
} from "@/services/openwhyd";

describe("apiPlaylist", () => {
	it("returns the correct API URL", () => {
		expect(apiPlaylist("abc123", "5")).toBe(
			"https://openwhyd.org/api/playlist/abc123_5",
		);
	});

	it("handles undefined userId and playlistId", () => {
		expect(apiPlaylist(undefined, undefined)).toBe(
			"https://openwhyd.org/api/playlist/undefined_undefined",
		);
	});
});

describe("apiUser", () => {
	it("returns the correct user API URL with query params", () => {
		expect(apiUser("abc123")).toBe(
			"https://openwhyd.org/api/user/abc123?countPosts=true&countLikes=true",
		);
	});
});

describe("userListOfPlaylists", () => {
	it("returns the correct URL with limit", () => {
		expect(userListOfPlaylists("abc123")).toBe(
			`https://openwhyd.org/u/abc123/playlists?format=json&limit=${MAX_PLAYLISTS}`,
		);
	});
});

describe("userPlaylist", () => {
	it("returns the base URL when afterId is omitted", () => {
		expect(userPlaylist("abc123", "5")).toBe(
			`https://openwhyd.org/u/abc123/playlist/5?format=json&limit=${MAX_FETCHED_ITEMS - 1}`,
		);
	});

	it("appends &after= when afterId is provided", () => {
		expect(userPlaylist("abc123", "5", "xyz")).toBe(
			`https://openwhyd.org/u/abc123/playlist/5?format=json&limit=${MAX_FETCHED_ITEMS - 1}&after=xyz`,
		);
	});
});

describe("userImg", () => {
	it("returns the correct user image URL", () => {
		expect(userImg("abc123")).toBe("https://openwhyd.org/img/user/abc123");
	});
});

describe("playlistImg", () => {
	it("returns the correct playlist image URL", () => {
		expect(playlistImg("abc123_5")).toBe(
			"https://openwhyd.org/img/playlist/abc123_5",
		);
	});
});

describe("hotPlaylist", () => {
	it("returns the base URL without skip", () => {
		expect(hotPlaylist()).toBe(
			`https://openwhyd.org/hot?format=json&limit=${MAX_FETCHED_ITEMS}`,
		);
	});

	it("appends &skip= when skip is provided", () => {
		expect(hotPlaylist(100)).toBe(
			`https://openwhyd.org/hot?format=json&limit=${MAX_FETCHED_ITEMS}&skip=100`,
		);
	});

	it("omits &skip= when skip is 0", () => {
		// skip=0 is falsy, so the base URL is returned
		expect(hotPlaylist(0)).toBe(
			`https://openwhyd.org/hot?format=json&limit=${MAX_FETCHED_ITEMS}`,
		);
	});
});

describe("allPlaylist", () => {
	it("returns the base URL without afterId", () => {
		expect(allPlaylist()).toBe(
			`https://openwhyd.org/all?format=json&limit=${MAX_FETCHED_ITEMS}`,
		);
	});

	it("appends &after= when afterId is provided", () => {
		expect(allPlaylist("xyz")).toBe(
			`https://openwhyd.org/all?format=json&limit=${MAX_FETCHED_ITEMS}&after=xyz`,
		);
	});
});

describe("userLikesPlaylist", () => {
	it("returns the base URL without afterId", () => {
		expect(userLikesPlaylist("abc123")).toBe(
			"https://openwhyd.org/u/abc123/likes?format=json",
		);
	});

	it("appends &after= when afterId is provided", () => {
		expect(userLikesPlaylist("abc123", "xyz")).toBe(
			"https://openwhyd.org/u/abc123/likes?format=json&after=xyz",
		);
	});
});

describe("userAllPlaylist", () => {
	it("returns the base URL without afterId", () => {
		expect(userAllPlaylist("abc123")).toBe(
			`https://openwhyd.org/u/abc123?format=json&limit=${MAX_FETCHED_ITEMS - 1}`,
		);
	});

	it("appends &after= when afterId is provided", () => {
		expect(userAllPlaylist("abc123", "xyz")).toBe(
			`https://openwhyd.org/u/abc123?format=json&limit=${MAX_FETCHED_ITEMS - 1}&after=xyz`,
		);
	});
});

describe("userStreamPlaylist", () => {
	it("returns the base URL without afterId", () => {
		expect(userStreamPlaylist("abc123")).toBe(
			`https://openwhyd.org/stream?id=abc123&format=json&limit=${MAX_FETCHED_ITEMS}`,
		);
	});

	it("appends &after= when afterId is provided", () => {
		expect(userStreamPlaylist("abc123", "xyz")).toBe(
			`https://openwhyd.org/stream?id=abc123&format=json&limit=${MAX_FETCHED_ITEMS}&after=xyz`,
		);
	});
});

describe("search", () => {
	it("returns the correct search URL", () => {
		expect(search("hello world")).toBe(
			"https://openwhyd.org/search?q=hello world&format=json",
		);
	});

	it("handles undefined query", () => {
		expect(search(undefined)).toBe(
			"https://openwhyd.org/search?q=undefined&format=json",
		);
	});
});

// ---------------------------------------------------------------------------
// Fetch wrappers
// ---------------------------------------------------------------------------

function makeTracks(count: number) {
	return Array.from({ length: count }, (_, i) => ({
		_id: `id_${i}`,
		name: `Track ${i}`,
		eId: `/yt/id${i}`,
	}));
}

const USER_INFO = {
	id: "abc123",
	name: "testuser",
	nbPosts: 10,
	nbLikes: 5,
};

describe("fetchHotPlaylist", () => {
	it("returns tracks and hasMore=false when fewer than MAX_FETCHED_ITEMS tracks", async () => {
		const tracks = makeTracks(5);
		server.use(
			http.get("https://openwhyd.org/hot", () => HttpResponse.json({ tracks })),
		);
		const result = await fetchHotPlaylist();
		expect(result.tracks).toEqual(tracks);
		expect(result.hasMore).toBe(false);
	});

	it("returns hasMore=true when exactly MAX_FETCHED_ITEMS tracks", async () => {
		const tracks = makeTracks(MAX_FETCHED_ITEMS);
		server.use(
			http.get("https://openwhyd.org/hot", () => HttpResponse.json({ tracks })),
		);
		const { hasMore } = await fetchHotPlaylist();
		expect(hasMore).toBe(true);
	});

	it("passes skip to the API", async () => {
		let receivedSkip: string | null = null;
		server.use(
			http.get("https://openwhyd.org/hot", ({ request }) => {
				receivedSkip = new URL(request.url).searchParams.get("skip");
				return HttpResponse.json({ tracks: [] });
			}),
		);
		await fetchHotPlaylist(20);
		expect(receivedSkip).toBe("20");
	});

	it("throws on non-200 response", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/hot",
				() => new HttpResponse(null, { status: 500 }),
			),
		);
		await expect(fetchHotPlaylist()).rejects.toThrow("fetchHotPlaylist");
	});
});

describe("fetchAllPlaylist", () => {
	it("returns tracks and hasMore=false for a partial page", async () => {
		const tracks = makeTracks(3);
		server.use(
			http.get("https://openwhyd.org/all", () => HttpResponse.json(tracks)),
		);
		const result = await fetchAllPlaylist();
		expect(result.tracks).toEqual(tracks);
		expect(result.hasMore).toBe(false);
	});

	it("returns hasMore=true for a full page", async () => {
		const tracks = makeTracks(MAX_FETCHED_ITEMS);
		server.use(
			http.get("https://openwhyd.org/all", () => HttpResponse.json(tracks)),
		);
		const { hasMore } = await fetchAllPlaylist();
		expect(hasMore).toBe(true);
	});

	it("passes afterId to the API", async () => {
		let receivedAfter: string | null = null;
		server.use(
			http.get("https://openwhyd.org/all", ({ request }) => {
				receivedAfter = new URL(request.url).searchParams.get("after");
				return HttpResponse.json([]);
			}),
		);
		await fetchAllPlaylist("xyz");
		expect(receivedAfter).toBe("xyz");
	});

	it("throws on non-200 response", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/all",
				() => new HttpResponse(null, { status: 503 }),
			),
		);
		await expect(fetchAllPlaylist()).rejects.toThrow("fetchAllPlaylist");
	});
});

describe("fetchUserPlaylist", () => {
	it("returns tracks for a normal JSON response", async () => {
		const tracks = makeTracks(3);
		server.use(
			http.get("https://openwhyd.org/u/:userId/playlist/:playlistId", () =>
				HttpResponse.json(tracks),
			),
		);
		const result = await fetchUserPlaylist("abc123", "5");
		expect(result?.tracks).toEqual(tracks);
		expect(result?.hasMore).toBe(false);
	});

	it("returns null when the response is non-200", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/u/:userId/playlist/:playlistId",
				() => new HttpResponse(null, { status: 404 }),
			),
		);
		const result = await fetchUserPlaylist("abc123", "5");
		expect(result).toBeNull();
	});

	it("returns null when the response body starts with 'moved'", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/u/:userId/playlist/:playlistId",
				() =>
					new HttpResponse("moved to /some-other-page", {
						status: 200,
						headers: { "Content-Type": "text/plain" },
					}),
			),
		);
		const result = await fetchUserPlaylist("abc123", "5");
		expect(result).toBeNull();
	});
});

describe("fetchApiPlaylist", () => {
	it("returns the parsed playlist array on success", async () => {
		const playlist = [
			{
				id: "abc123_5",
				name: "Test",
				uId: "abc123",
				uNm: "testuser",
				plId: "5",
				nbTracks: 3,
			},
		];
		server.use(
			http.get("https://openwhyd.org/api/playlist/:id", () =>
				HttpResponse.json(playlist),
			),
		);
		const result = await fetchApiPlaylist("abc123", "5");
		expect(result).toEqual(playlist);
	});

	it("returns null on non-200 response", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/api/playlist/:id",
				() => new HttpResponse(null, { status: 404 }),
			),
		);
		const result = await fetchApiPlaylist("abc123", "5");
		expect(result).toBeNull();
	});
});

describe("fetchUserInfo", () => {
	it("returns user info on success", async () => {
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
		);
		const result = await fetchUserInfo("abc123");
		expect(result).toEqual(USER_INFO);
	});

	it("returns null on non-200 response", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/api/user/:userId",
				() => new HttpResponse(null, { status: 404 }),
			),
		);
		const result = await fetchUserInfo("abc123");
		expect(result).toBeNull();
	});
});

describe("fetchUserSpecialPlaylist", () => {
	it("returns null when the user is not found", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/api/user/:userId",
				() => new HttpResponse(null, { status: 404 }),
			),
		);
		const result = await fetchUserSpecialPlaylist("abc123", "all");
		expect(result).toBeNull();
	});

	it("returns playlistInfo and tracks for type 'all'", async () => {
		const tracks = makeTracks(3);
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
			http.get("https://openwhyd.org/u/:userId", () =>
				HttpResponse.json(tracks),
			),
		);
		const result = await fetchUserSpecialPlaylist("abc123", "all");
		expect(result?.playlistInfo.uNm).toBe("testuser");
		expect(result?.tracks).toEqual(tracks);
		expect(result?.hasMore).toBe(false);
	});

	it("returns playlistInfo and tracks for type 'likes'", async () => {
		const tracks = makeTracks(3);
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
			http.get("https://openwhyd.org/u/:userId/likes", () =>
				HttpResponse.json(tracks),
			),
		);
		const result = await fetchUserSpecialPlaylist("abc123", "likes");
		expect(result?.tracks).toEqual(tracks);
	});

	it("returns playlistInfo and tracks for type 'stream'", async () => {
		const tracks = makeTracks(3);
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
			http.get("https://openwhyd.org/stream", () => HttpResponse.json(tracks)),
		);
		const result = await fetchUserSpecialPlaylist("abc123", "stream");
		expect(result?.tracks).toEqual(tracks);
	});

	it("returns empty tracks and hasMore=false when the tracks endpoint fails", async () => {
		server.use(
			http.get("https://openwhyd.org/api/user/:userId", () =>
				HttpResponse.json(USER_INFO),
			),
			http.get(
				"https://openwhyd.org/u/:userId",
				() => new HttpResponse(null, { status: 503 }),
			),
		);
		const result = await fetchUserSpecialPlaylist("abc123", "all");
		expect(result?.tracks).toEqual([]);
		expect(result?.hasMore).toBe(false);
	});
});

describe("fetchUserListOfPlaylists", () => {
	it("returns the parsed playlist list on success", async () => {
		const playlists = [
			{ id: 5, name: "My Playlist", url: "/pl/5", nbTracks: 10 },
		];
		server.use(
			http.get("https://openwhyd.org/u/:userId/playlists", () =>
				HttpResponse.json(playlists),
			),
		);
		const result = await fetchUserListOfPlaylists("abc123");
		expect(result).toEqual(playlists);
	});

	it("returns null on non-200 response", async () => {
		server.use(
			http.get(
				"https://openwhyd.org/u/:userId/playlists",
				() => new HttpResponse(null, { status: 404 }),
			),
		);
		const result = await fetchUserListOfPlaylists("abc123");
		expect(result).toBeNull();
	});
});

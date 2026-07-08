import { describe, expect, it } from "vitest";
import { MAX_FETCHED_ITEMS, MAX_PLAYLISTS } from "@/config.shared";
import {
	allPlaylist,
	apiPlaylist,
	apiUser,
	hotPlaylist,
	playlistImg,
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

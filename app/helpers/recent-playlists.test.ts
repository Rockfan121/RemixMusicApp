import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MAX_PLAYLISTS } from "@/config.shared";
import {
	addToRecentPlaylists,
	getRecentPlaylists,
} from "@/helpers/recent-playlists";
import type { ApiPlaylist } from "@/types/openwhyd-types";

function makePl(id: string, name = `Playlist ${id}`): ApiPlaylist {
	return { id, name, uId: "u1", uNm: "user1", plId: id, nbTracks: 5 };
}

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	localStorage.clear();
});

// ---------------------------------------------------------------------------
// getRecentPlaylists
// ---------------------------------------------------------------------------

describe("getRecentPlaylists", () => {
	it("returns an empty array when localStorage is empty", () => {
		expect(getRecentPlaylists()).toEqual([]);
	});

	it("returns the previously stored playlists", () => {
		const pl = makePl("abc123_1");
		localStorage.setItem("recentPlaylists", JSON.stringify([pl]));
		expect(getRecentPlaylists()).toEqual([pl]);
	});

	it("returns an empty array when stored JSON is malformed", () => {
		localStorage.setItem("recentPlaylists", "not-valid-json{{{");
		expect(getRecentPlaylists()).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// addToRecentPlaylists
// ---------------------------------------------------------------------------

describe("addToRecentPlaylists", () => {
	it("adds a playlist to an empty list", () => {
		const pl = makePl("abc123_1");
		addToRecentPlaylists(pl);
		expect(getRecentPlaylists()).toEqual([pl]);
	});

	it("prepends the new playlist (most-recent first)", () => {
		const pl1 = makePl("abc123_1");
		const pl2 = makePl("abc123_2");
		addToRecentPlaylists(pl1);
		addToRecentPlaylists(pl2);
		const result = getRecentPlaylists();
		expect(result[0]).toEqual(pl2);
		expect(result[1]).toEqual(pl1);
	});

	it("moves an already-present playlist to the front", () => {
		const pl1 = makePl("abc123_1");
		const pl2 = makePl("abc123_2");
		addToRecentPlaylists(pl1);
		addToRecentPlaylists(pl2);
		// Add pl1 again — it should bubble to the top
		addToRecentPlaylists(pl1);
		const result = getRecentPlaylists();
		expect(result[0]).toEqual(pl1);
		expect(result[1]).toEqual(pl2);
		expect(result).toHaveLength(2);
	});

	it("does not create duplicates", () => {
		const pl = makePl("abc123_1");
		addToRecentPlaylists(pl);
		addToRecentPlaylists(pl);
		expect(getRecentPlaylists()).toHaveLength(1);
	});

	it(`trims the list to at most ${MAX_PLAYLISTS} entries`, () => {
		for (let i = 0; i < MAX_PLAYLISTS + 5; i++) {
			addToRecentPlaylists(makePl(`id_${i}`));
		}
		expect(getRecentPlaylists()).toHaveLength(MAX_PLAYLISTS);
	});

	it("keeps the MAX_PLAYLISTS most-recently added entries", () => {
		for (let i = 0; i < MAX_PLAYLISTS + 2; i++) {
			addToRecentPlaylists(makePl(`id_${i}`));
		}
		const result = getRecentPlaylists();
		// The last two added should be at the front
		expect(result[0].id).toBe(`id_${MAX_PLAYLISTS + 1}`);
		expect(result[1].id).toBe(`id_${MAX_PLAYLISTS}`);
	});
});

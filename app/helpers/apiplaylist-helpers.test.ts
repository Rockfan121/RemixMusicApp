import { describe, expect, it } from "vitest";
import { imgUrl, myUrl, openwhydUrl } from "@/helpers/apiplaylist-helpers";
import { playlistImg } from "@/services/openwhyd";
import type { ApiPlaylist } from "@/types/openwhyd-types";
import {
	HOT_TRACKS_LINK,
	PlaylistsIDs,
	RECENT_TRACKS_LINK,
} from "@/types/playlists-types";

function makePlaylist(overrides: Partial<ApiPlaylist> = {}): ApiPlaylist {
	return {
		id: "abc123_5",
		name: "Test Playlist",
		uId: "abc123",
		uNm: "testuser",
		plId: "5",
		nbTracks: 10,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// myUrl
// ---------------------------------------------------------------------------

describe("myUrl", () => {
	it("returns RECENT_TRACKS_LINK for the All playlist", () => {
		expect(myUrl(makePlaylist({ id: PlaylistsIDs.All }))).toBe(
			RECENT_TRACKS_LINK,
		);
	});

	it("returns HOT_TRACKS_LINK for the Hot playlist", () => {
		expect(myUrl(makePlaylist({ id: PlaylistsIDs.Hot }))).toBe(HOT_TRACKS_LINK);
	});

	it("returns /tracks/:uId/all for the UserAll playlist", () => {
		expect(
			myUrl(makePlaylist({ id: PlaylistsIDs.UserAll, uId: "abc123" })),
		).toBe("/tracks/abc123/all");
	});

	it("returns /tracks/:uId/likes for the UserLikes playlist", () => {
		expect(
			myUrl(makePlaylist({ id: PlaylistsIDs.UserLikes, uId: "abc123" })),
		).toBe("/tracks/abc123/likes");
	});

	it("returns /tracks/:uId/stream for the UserStream playlist", () => {
		expect(
			myUrl(makePlaylist({ id: PlaylistsIDs.UserStream, uId: "abc123" })),
		).toBe("/tracks/abc123/stream");
	});

	it("returns /tracks/:uId/:plId for a regular user playlist", () => {
		expect(
			myUrl(makePlaylist({ id: "abc123_5", uId: "abc123", plId: "5" })),
		).toBe("/tracks/abc123/5");
	});
});

// ---------------------------------------------------------------------------
// openwhydUrl
// ---------------------------------------------------------------------------

describe("openwhydUrl", () => {
	it("returns the openwhyd/all URL for the All playlist", () => {
		expect(openwhydUrl(makePlaylist({ id: PlaylistsIDs.All }))).toBe(
			"https://openwhyd.org/all",
		);
	});

	it("returns the openwhyd/hot URL for the Hot playlist", () => {
		expect(openwhydUrl(makePlaylist({ id: PlaylistsIDs.Hot }))).toBe(
			"https://openwhyd.org/hot",
		);
	});

	it("returns the openwhyd user URL for the UserAll playlist", () => {
		expect(
			openwhydUrl(makePlaylist({ id: PlaylistsIDs.UserAll, uId: "abc123" })),
		).toBe("https://openwhyd.org/u/abc123");
	});

	it("returns the openwhyd user likes URL for the UserLikes playlist", () => {
		expect(
			openwhydUrl(makePlaylist({ id: PlaylistsIDs.UserLikes, uId: "abc123" })),
		).toBe("https://openwhyd.org/u/abc123/likes");
	});

	it("returns an empty string for the UserStream playlist", () => {
		expect(openwhydUrl(makePlaylist({ id: PlaylistsIDs.UserStream }))).toBe("");
	});

	it("returns the openwhyd playlist URL for a regular user playlist", () => {
		expect(
			openwhydUrl(makePlaylist({ id: "abc123_5", uId: "abc123", plId: "5" })),
		).toBe("https://openwhyd.org/u/abc123/playlist/5");
	});
});

// ---------------------------------------------------------------------------
// imgUrl
// ---------------------------------------------------------------------------

describe("imgUrl", () => {
	it("returns a non-empty string for the All playlist ID", () => {
		const result = imgUrl(PlaylistsIDs.All);
		expect(typeof result).toBe("string");
		expect(result).toBeTruthy();
	});

	it("returns a non-empty string for the Hot playlist ID", () => {
		const result = imgUrl(PlaylistsIDs.Hot);
		expect(typeof result).toBe("string");
		expect(result).toBeTruthy();
	});

	it("returns a non-empty string for the UserAll playlist ID", () => {
		const result = imgUrl(PlaylistsIDs.UserAll);
		expect(typeof result).toBe("string");
		expect(result).toBeTruthy();
	});

	it("returns a non-empty string for the UserLikes playlist ID", () => {
		const result = imgUrl(PlaylistsIDs.UserLikes);
		expect(typeof result).toBe("string");
		expect(result).toBeTruthy();
	});

	it("returns a non-empty string for the UserStream playlist ID", () => {
		const result = imgUrl(PlaylistsIDs.UserStream);
		expect(typeof result).toBe("string");
		expect(result).toBeTruthy();
	});

	it("delegates to playlistImg for an unknown playlist ID", () => {
		const unknownId = "abc123_99";
		expect(imgUrl(unknownId)).toBe(playlistImg(unknownId));
	});
});

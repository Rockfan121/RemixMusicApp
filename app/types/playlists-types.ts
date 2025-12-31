import { MAX_FETCHED_ITEMS } from "@/config.shared";
import type { ApiPlaylist } from "./openwhyd-types";

export const PlaylistsIDs = {
	All: "all",
	Hot: "hot",
	UserAll: "uAll",
	UserLikes: "uLikes",
} as const;

export const PlaylistsNames = {
	All: "Recent tracks from all users",
	Hot: "Hot tracks",
	UserAll: "All tracks",
	UserLikes: "Likes",
} as const;

export const HOT_TRACKS_LINK = "/player/tracks/hot";
export const RECENT_TRACKS_LINK = "/player/tracks/all";

export const allPlaylistInfo: ApiPlaylist = {
	id: PlaylistsIDs.All,
	name: PlaylistsNames.All,
	uId: "",
	uNm: "",
	plId: "",
	nbTracks: MAX_FETCHED_ITEMS,
};

export const hotPlaylistInfo: ApiPlaylist = {
	id: PlaylistsIDs.Hot,
	name: PlaylistsNames.Hot,
	uId: "",
	uNm: "",
	plId: "",
	nbTracks: MAX_FETCHED_ITEMS,
};

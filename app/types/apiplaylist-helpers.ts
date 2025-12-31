import { playlistImg } from "@/services/openwhyd";
import type { ApiPlaylist } from "./openwhyd-types";
import {
	HOT_TRACKS_LINK,
	PlaylistsIDs,
	RECENT_TRACKS_LINK,
} from "./playlists-types";

export function myUrl(pl: ApiPlaylist) {
	switch (pl.id) {
		case PlaylistsIDs.All:
			return RECENT_TRACKS_LINK;
		case PlaylistsIDs.Hot:
			return HOT_TRACKS_LINK;
		case PlaylistsIDs.UserAll:
			return `/player/tracks/${pl.uId}/all`;
		case PlaylistsIDs.UserLikes:
			return `/player/tracks/${pl.uId}/likes`;
		default:
			return `/player/tracks/${pl.uId}/${pl.plId}`;
	}
}
export function openwhydUrl(pl: ApiPlaylist) {
	switch (pl.id) {
		case PlaylistsIDs.All:
			return "https://openwhyd.org/all";
		case PlaylistsIDs.Hot:
			return "https://openwhyd.org/hot";
		case PlaylistsIDs.UserAll:
			return `https://openwhyd.org/u/${pl.uId}`;
		case PlaylistsIDs.UserLikes:
			return `https://openwhyd.org/u/${pl.uId}/likes`;
		default:
			return `https://openwhyd.org/u/${pl.uId}/playlist/${pl.plId}`;
	}
}
export function imgUrl(id: string) {
	switch (id) {
		case PlaylistsIDs.All:
			return "https://cdn.pixabay.com/photo/2019/12/28/18/08/plate-4725349_640.jpg";
		case PlaylistsIDs.Hot:
			return "https://cdn.pixabay.com/photo/2020/04/04/15/04/audio-5002628_640.jpg";
		case PlaylistsIDs.UserAll:
			return "https://cdn.pixabay.com/photo/2015/03/11/17/36/sheet-music-668974_640.jpg";
		case PlaylistsIDs.UserLikes:
			return "https://cdn.pixabay.com/photo/2022/06/25/21/12/music-heart-7284225_640.jpg";
		default:
			return playlistImg(id);
	}
}

import headphones from "@/assets/headphones.jpg";
import music_heart from "@/assets/music_heart.jpg";
import musical_note from "@/assets/musical_note.jpg";
import plate from "@/assets/plate.jpg";
import sheet_music from "@/assets/sheet_music.jpg";
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
			return `/tracks/${pl.uId}/all`;
		case PlaylistsIDs.UserLikes:
			return `/tracks/${pl.uId}/likes`;
		case PlaylistsIDs.UserStream:
			return `/tracks/${pl.uId}/stream`;
		default:
			return `/tracks/${pl.uId}/${pl.plId}`;
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
		case PlaylistsIDs.UserStream:
			return "";
		default:
			return `https://openwhyd.org/u/${pl.uId}/playlist/${pl.plId}`;
	}
}
export function imgUrl(id: string) {
	switch (id) {
		case PlaylistsIDs.All:
			return plate;
		case PlaylistsIDs.Hot:
			return headphones;
		case PlaylistsIDs.UserAll:
			return sheet_music;
		case PlaylistsIDs.UserLikes:
			return music_heart;
		case PlaylistsIDs.UserStream:
			return musical_note;
		default:
			return playlistImg(id);
	}
}

import { playlistImg } from "@/services/openwhyd";
import type { ApiPlaylist } from "./openwhyd-types";

export function myUrl(pl: ApiPlaylist) {
	switch (pl.id) {
		case "all":
			return "/player/tracks/";
		case "hot":
			return "/player/tracks/hot";
		case "uAll":
			return `/player/tracks/${pl.uId}`;
		case "uLikes":
			return `/player/tracks/${pl.uId}/likes`;
		default:
			return `/player/tracks/${pl.uId}/${pl.plId}`;
	}
}
export function openwhydUrl(pl: ApiPlaylist) {
	switch (pl.id) {
		case "all":
			return "https://openwhyd.org/all";
		case "hot":
			return "https://openwhyd.org/hot";
		case "uAll":
			return "https://openwhyd.org/u/${pl.uId}";
		case "uLikes":
			return "https://openwhyd.org/u/${pl.uId}/likes";
		default:
			return `https://openwhyd.org/u/${pl.uId}/playlist/${pl.plId}`;
	}
}
export function imgUrl(pl: ApiPlaylist) {
	switch (pl.id) {
		case "all":
			return "https://cdn.pixabay.com/photo/2019/12/28/18/08/plate-4725349_640.jpg";
		case "hot":
			return "https://cdn.pixabay.com/photo/2020/04/04/15/04/audio-5002628_640.jpg";
		case "uAll":
			return "https://cdn.pixabay.com/photo/2015/03/11/17/36/sheet-music-668974_640.jpg";
		case "uLikes":
			return "https://cdn.pixabay.com/photo/2022/06/25/21/12/music-heart-7284225_640.jpg";
		default:
			return playlistImg(pl.id);
	}
}

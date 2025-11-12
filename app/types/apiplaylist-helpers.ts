import { playlistImg } from "@/services/openwhyd";
import type { ApiPlaylist } from "./openwhyd-types";

export function myUrl(pl: ApiPlaylist) {
	return `/player/tracks/${pl.uId}/${pl.plId}`;
}
export function openwhydUrl(pl: ApiPlaylist) {
	return `https://openwhyd.org/u/${pl.uId}/playlist/${pl.plId}`;
}
export function imgUrl(pl: ApiPlaylist) {
	return playlistImg(pl.id);
}

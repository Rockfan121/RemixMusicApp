import type { XPlaylist } from "./xplaylist-type";

export function myUrl(pl: XPlaylist) {
	return `/player/tracks/${pl.uId}/${pl.plId}`;
}
export function openwhydUrl(pl: XPlaylist) {
	return `https://openwhyd.org/u/${pl.uId}/playlist/${pl.plId}`;
}
export function imgUrl(pl: XPlaylist) {
	return `https://openwhyd.org/img/playlist/${pl.id}`;
}

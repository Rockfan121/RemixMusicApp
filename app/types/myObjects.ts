import type { Track } from "@/types/openwhydObjects";

/**
 * Extended version of Playlist type (see ../types/openwhydObjects/Playlist)
 * @param uNm - Openwhyd user name (the playlist owner)
 * @param uId - Openwhyd user id (see above)
 * @param id - playlist id (just a number, it's not unique in the set of all Openwhyd playlists)
 * @param name - playlist name
 * @param url - partial url to Openwhyd playlist - and it IS unique
 * @param nbTracks - number of tracks in the playlist
 * @param img - playlist cover image
 */
export type XPlaylist = {
	uNm: string;
	uId: string;
	id: number;
	name: string;
	url: string;
	nbTracks: number;
	img: string;
};

/**
 * Interface for passing callback to OutletContext (it fires MusicPlayer when user click a track e.g. in "tracks" route)
 */
export interface ContextType {
	callback: (a: Array<Track>, b: number, c: XPlaylist) => void;
	favesCallback: (a: XPlaylist) => void;
}

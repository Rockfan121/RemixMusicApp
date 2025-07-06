/**
 * Extended version of ApiPlaylist type (see openwhyd-types.ts)
 * @param id - Openwhyd playlist unique id, formatted as uId_plId
 * @param name - playlist name
 * @param uId - Openwhyd user id (the playlist owner)
 * @param uNm - Openwhyd user name (the playlist owner)
 * @param plId - playlist id (not unique, just a string with a number)
 * @param nbTracks - number of tracks in the playlist
 * @param doesExist - playlist status
 */
export type XPlaylist = {
	id: string;
	name: string;
	uId: string;
	uNm: string;
	plId: string;
	nbTracks: number;
	doesExist: boolean;
};

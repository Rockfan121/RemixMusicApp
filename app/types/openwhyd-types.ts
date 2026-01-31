/**
 * Playlist type used in Openwhyd /api/playlist
 * @param id - Openwhyd playlist unique id, formatted as uId_plId
 * @param name - playlist name
 * @param uId - Openwhyd user id (the playlist owner)
 * @param uNm - Openwhyd user name (the playlist owner)
 * @param plId - playlist id (not unique, just a string with a number)
 * @param nbTracks - number of tracks in the playlist
 */
export type ApiPlaylist = {
	id: string;
	name: string;
	uId: string;
	uNm: string;
	plId: string;
	nbTracks: number;
};

/**
 * Playlist type used in Openwhyd /u/uId/playlist
 * @param id - same as plId in ApiPlaylist (but formatted as a number)
 * @param name - same as name in ApiPlaylist
 * @param url - partial Openwhyd url to the playlist
 * @param nbTracks - same as nbTracks in ApiPlaylist
 */
export type UserPlaylist = {
	id: number;
	name: string;
	url: string;
	nbTracks: number;
};

type PlaylistInfo = {
	id: number;
	name: string;
};

type RepostInfo = {
	pId: string;
	uId: string;
	uNm: string;
};

export type Track = {
	_id: string;
	uId: string;
	uNm: string;
	text: string;
	name: string;
	eId: string;
	ctx: string;
	pl: PlaylistInfo;
	img: string;
	repost: RepostInfo;
	order: number;
	lov: Array<string>;
	nbR: number;
	nbP: number;
};

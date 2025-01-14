export type Playlist = {
	id: string;
	name: string;
	url: string;
	nbTracks: number;
	img: string;
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
	pl: PlaylistInfo;
	img: string;
	repost: RepostInfo;
	lov: Array<string>;
	nbR: number;
	nbP: number;
};

export type QueuedTrack = {
	title: string;
	url: string;
};

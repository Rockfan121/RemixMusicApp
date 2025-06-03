export type Playlist = {
	id: number;
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
	ctx: string;
	pl: PlaylistInfo;
	img: string;
	repost: RepostInfo;
	order: number;
	lov: Array<string>;
	nbR: number;
	nbP: number;
};

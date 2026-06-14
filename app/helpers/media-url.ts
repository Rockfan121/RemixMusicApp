//Functions returning a correct URL to a track from a specific music platform.
//The music platform is determined by eId string - a parameter of Openwhyd's type Track (see openwhyd-types.ts)
export const getMusicServiceAndUrl = (eId: string) => {
	const musicService = eId.substring(1, 3);
	const id = eId.substring(4);

	switch (musicService) {
		case "yt":
			return getYouTubeUrl(id);
		case "sc":
			return getSoundCloudUrl(id);
		case "dm":
			return getDailyMotionUrl(id);
		case "vi":
			return getVimeoUrl(id);
		case "bc":
			return getBandcampUrl(id);
		case "fi":
			return id;
	}
	return eId;
};

export const isBandcampUrl = (url: string) =>
	url.includes(".bandcamp.com/track/");

export const MATCH_URL_DAILYMOTION =
	/(?:dailymotion\.com(?:\/embed)?\/video|dai\.ly)\/([a-zA-Z0-9]+)/;

export const isDailymotionUrl = (url: string) =>
	MATCH_URL_DAILYMOTION.test(url);

const getYouTubeUrl = (id: string) => {
	return `https://www.youtube.com/watch?v=${id}`;
};

const getSoundCloudUrl = (id: string) => {
	return `https://soundcloud.com/${id}`;
};

const getDailyMotionUrl = (id: string) => {
	return `https://www.dailymotion.com/video/${id}`;
};

const getVimeoUrl = (id: string) => {
	return `https://vimeo.com/${id}`;
};

const getBandcampUrl = (id: string) => {
	const splitId = id.split("/");
	const artist = splitId[0];
	const track = splitId[1];
	return `https://${artist}.bandcamp.com/track/${track}`;
};

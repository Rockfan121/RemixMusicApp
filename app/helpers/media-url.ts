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
	}
	return "";
};

const getYouTubeUrl = (id: string) => {
	console.log("getYouTubeUrl");
	return `https://www.youtube.com/watch?v=${id}`;
};

const getSoundCloudUrl = (id: string) => {
	console.log("getSoundCloudUrl");
	return `https://soundcloud.com/${id}`;
};

const getDailyMotionUrl = (id: string) => {
	console.log("getDailyMotionUrl");
	return `https://www.dailymotion.com/video/${id}`;
};

const getVimeoUrl = (id: string) => {
	console.log("getVimeoUrl");
	return `https://vimeo.com/${id}`;
};

const getBandcampUrl = (id: string) => {
	console.log("getBandcampUrl");
	const splitId = id.split("/");
	const artist = splitId[0];
	const track = splitId[1];
	return `https://${artist}.bandcamp.com/track/${track}`;
};

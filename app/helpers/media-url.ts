//Functions returning a correct URL to a track from a specific music platform.
//The music platform is determined by eId string - a parameter of Openwhyd's type Track (see openwhyd-types.ts)
export const getYTUrl = (eId: string) => {
	let result = eId.substring(4);
	result = `https://www.youtube.com/watch?v=${result}`;
	return result;
};

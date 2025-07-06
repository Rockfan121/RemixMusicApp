//Return type for ReactPlayer's onProgress callback
export type ProgressState = {
	played: number;
	playedSeconds: number;
	loaded: number;
	loadedSeconds: number;
};

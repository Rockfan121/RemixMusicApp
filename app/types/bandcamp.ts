export interface BandcampPlayerHandle {
	seekTo: (fraction: number) => void;
	setMuted: (muted: boolean) => void;
	getMuted: () => boolean;
}

export interface BandcampTrackData {
	streamUrl: string;
	duration: number;
	trackTitle: string;
	albumTitle: string;
	coverArt: string;
}

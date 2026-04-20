import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";

export interface BandcampPlayerHandle {
	seekTo: (fraction: number) => void;
	setMuted: (muted: boolean) => void;
	getMuted: () => boolean;
}

interface BandcampTrackData {
	streamUrl: string;
	duration: number;
	trackTitle: string;
	albumTitle: string;
	coverArt: string;
}

interface ProgressState {
	played: number;
	loaded: number;
	playedSeconds: number;
	loadedSeconds: number;
}

interface BandcampPlayerProps {
	url: string;
	playing: boolean;
	loop?: boolean;
	volume: number;
	muted: boolean;
	onReady?: () => void;
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onProgress?: (state: ProgressState) => void;
	onDuration?: (duration: number) => void;
	onError?: (error: unknown) => void;
}

function parseBandcampUrl(url: string) {
	const match = url.match(
		/^https?:\/\/([^.]+)\.bandcamp\.com\/track\/([^/?#]+)/,
	);
	if (!match) return null;
	return { artist: match[1], track: match[2] };
}

/**
 * Plays a single Bandcamp track via the /api/bandcamp-track proxy route,
 * which calls bcFetch from bandcamp-fetch to obtain
 * a signed mp3-128 stream URL. Calls onError if the proxy is unavailable or
 * the stream cannot be fetched, allowing the parent to skip to the next track.
 */
export const BandcampPlayer = forwardRef<
	BandcampPlayerHandle,
	BandcampPlayerProps
>(
	(
		{
			url,
			playing,
			loop = false,
			volume,
			muted,
			onReady,
			onPlay,
			onPause,
			onEnded,
			onProgress,
			onDuration,
			onError,
		},
		ref,
	) => {
		const audioRef = useRef<HTMLAudioElement>(null);
		const [trackData, setTrackData] = useState<BandcampTrackData | null>(null);
		const [isLoading, setIsLoading] = useState(true);

		// Store callbacks in refs so effects that read them don't need them as
		// dependencies. This prevents a re-fetch every time the parent re-renders
		// and passes new (non-memoised) function references.
		const onReadyRef = useRef(onReady);
		const onPlayRef = useRef(onPlay);
		const onPauseRef = useRef(onPause);
		const onEndedRef = useRef(onEnded);
		const onProgressRef = useRef(onProgress);
		const onDurationRef = useRef(onDuration);
		const onErrorRef = useRef(onError);
		onReadyRef.current = onReady;
		onPlayRef.current = onPlay;
		onPauseRef.current = onPause;
		onEndedRef.current = onEnded;
		onProgressRef.current = onProgress;
		onDurationRef.current = onDuration;
		onErrorRef.current = onError;

		useImperativeHandle(ref, () => ({
			seekTo: (fraction: number) => {
				const audio = audioRef.current;
				if (audio && audio.duration > 0) {
					audio.currentTime = fraction * audio.duration;
				}
			},
			setMuted: (muted: boolean) => {
				const audio = audioRef.current;
				if (audio) audio.muted = muted;
			},
			getMuted: () => audioRef.current?.muted ?? false,
		}));

		// Fetch stream data from proxy whenever the Bandcamp URL changes.
		// Callbacks intentionally omitted from deps — they are read via refs so
		// that non-memoised parent functions don't trigger an unnecessary re-fetch.
		useEffect(() => {
			const parsed = parseBandcampUrl(url);
			if (!parsed) {
				onErrorRef.current?.(new Error(`Invalid Bandcamp URL: ${url}`));
				return;
			}

			setTrackData(null);
			setIsLoading(true);

			const params = new URLSearchParams({
				artist: parsed.artist,
				track: parsed.track,
			});

			let cancelled = false;

			fetch(`/api/bandcamp-track?${params}`)
				.then((res) => res.json())
				.then((data: { error?: string } & Partial<BandcampTrackData>) => {
					if (cancelled) return;
					if (data.error) {
						console.error("BandcampPlayer: proxy error:", data.error);
						onErrorRef.current?.(new Error(data.error));
					} else {
						setTrackData(data as BandcampTrackData);
					}
					setIsLoading(false);
				})
				.catch((err: unknown) => {
					if (cancelled) return;
					console.error("BandcampPlayer: fetch failed:", err);
					setIsLoading(false);
					onErrorRef.current?.(err);
				});

			return () => {
				cancelled = true;
			};
		}, [url]); // only url — callbacks are stable via refs

		// Play / pause control
		useEffect(() => {
			const audio = audioRef.current;
			if (!audio || !trackData) return;
			if (playing) {
				audio.play().catch((err: unknown) => {
					// Autoplay may be blocked by browser policy; not a fatal error
					console.warn("BandcampPlayer: audio.play() was prevented:", err);
				});
			} else {
				audio.pause();
			}
		}, [playing, trackData]);

		// Volume control
		useEffect(() => {
			const audio = audioRef.current;
			if (!audio) return;
			audio.volume = volume;
		}, [volume]);

		// Muted control
		useEffect(() => {
			const audio = audioRef.current;
			if (!audio) return;
			audio.muted = muted;
		}, [muted]);

		if (isLoading) {
			return (
				<div
					className="flex items-center justify-center bg-muted rounded"
					style={{ width: 72, height: 72, marginTop: "1px" }}
				>
					<span className="text-xs text-muted-foreground">...</span>
				</div>
			);
		}

		if (!trackData) return null;

		return (
			<>
				{/* Hidden audio element — playback is controlled via refs and effects */}
				{/* biome-ignore lint/a11y/useMediaCaption: music streaming has no caption track */}
				<audio
					ref={audioRef}
					src={trackData.streamUrl}
					loop={loop}
					onCanPlay={() => onReadyRef.current?.()}
					onPlay={() => onPlayRef.current?.()}
					onPause={() => onPauseRef.current?.()}
					onEnded={() => onEndedRef.current?.()}
					onDurationChange={() => {
						const audio = audioRef.current;
						if (audio) onDurationRef.current?.(audio.duration);
					}}
					onTimeUpdate={() => {
						const audio = audioRef.current;
						if (!audio || !audio.duration) return;
						onProgressRef.current?.({
							played: audio.currentTime / audio.duration,
							loaded:
								audio.buffered.length > 0
									? audio.buffered.end(audio.buffered.length - 1) /
										audio.duration
									: 0,
							playedSeconds: audio.currentTime,
							loadedSeconds:
								audio.buffered.length > 0
									? audio.buffered.end(audio.buffered.length - 1)
									: 0,
						});
					}}
					onError={(e) => {
						onErrorRef.current?.(e);
					}}
					style={{ display: "none" }}
				/>
				<img
					src={trackData.coverArt}
					alt={trackData.trackTitle}
					style={{ width: 72, height: 72, marginTop: "1px", objectFit: "cover" }}
				/>
			</>
		);
	},
);

BandcampPlayer.displayName = "BandcampPlayer";

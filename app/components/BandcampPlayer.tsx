import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";

export interface BandcampPlayerHandle {
	seekTo: (fraction: number) => void;
}

interface BandcampTrackData {
	streamUrl: string;
	duration: number;
	trackTitle: string;
	albumTitle: string;
	coverArt: string;
	embedUrl: string;
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
 * which chains calls to the bc.wemakesites.net RESTful Bandcamp API to obtain
 * a signed mp3-128 stream URL. Falls back to a Bandcamp embed iframe when the
 * proxy is unavailable or the stream URL cannot be fetched.
 */
export const BandcampPlayer = forwardRef<
	BandcampPlayerHandle,
	BandcampPlayerProps
>(
	(
		{
			url,
			playing,
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
		const [useFallback, setUseFallback] = useState(false);
		const [isLoading, setIsLoading] = useState(true);

		useImperativeHandle(ref, () => ({
			seekTo: (fraction: number) => {
				const audio = audioRef.current;
				if (audio && audio.duration > 0) {
					audio.currentTime = fraction * audio.duration;
				}
			},
		}));

		// Fetch stream data from proxy whenever the Bandcamp URL changes
		useEffect(() => {
			const parsed = parseBandcampUrl(url);
			if (!parsed) {
				onError?.(new Error(`Invalid Bandcamp URL: ${url}`));
				return;
			}

			setTrackData(null);
			setUseFallback(false);
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
						setUseFallback(true);
						onError?.(new Error(data.error));
					} else {
						setTrackData(data as BandcampTrackData);
					}
					setIsLoading(false);
				})
				.catch((err: unknown) => {
					if (cancelled) return;
					console.error("BandcampPlayer: fetch failed:", err);
					setUseFallback(true);
					setIsLoading(false);
					onError?.(err);
				});

			return () => {
				cancelled = true;
			};
		}, [url, onError]);

		// Play / pause control
		useEffect(() => {
			const audio = audioRef.current;
			if (!audio || !trackData) return;
			if (playing) {
				audio.play().catch(() => {});
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

		// Fallback: render the Bandcamp embed iframe
		if (useFallback) {
			const parsed = parseBandcampUrl(url);
			const embedSrc =
				trackData?.embedUrl ??
				(parsed
					? `https://${parsed.artist}.bandcamp.com/track/${parsed.track}`
					: null);

			if (!embedSrc) return null;

			return (
				<iframe
					src={embedSrc}
					title="Bandcamp Player"
					style={{ border: 0, width: 74, height: 74 }}
					seamless
				/>
			);
		}

		if (isLoading) {
			return (
				<div
					className="flex items-center justify-center bg-muted rounded"
					style={{ width: 74, height: 74 }}
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
					onCanPlay={onReady}
					onPlay={onPlay}
					onPause={onPause}
					onEnded={onEnded}
					onDurationChange={() => {
						const audio = audioRef.current;
						if (audio) onDuration?.(audio.duration);
					}}
					onTimeUpdate={() => {
						const audio = audioRef.current;
						if (!audio || !audio.duration) return;
						onProgress?.({
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
						setUseFallback(true);
						onError?.(e);
					}}
					style={{ display: "none" }}
				/>
				<img
					src={trackData.coverArt}
					alt={trackData.trackTitle}
					style={{ width: 74, height: 74, objectFit: "cover" }}
				/>
			</>
		);
	},
);

BandcampPlayer.displayName = "BandcampPlayer";

import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import { toast } from "sonner";
import type { ProgressState } from "@/types/progress-state-type";

const DAILYMOTION_REGEX =
	/^(?:(?:https?):)?(?:\/\/)?(?:www\.)?(?:(?:dailymotion\.com(?:\/embed)?\/video)|dai\.ly)\/([a-zA-Z0-9]+)(?:_[\w_-]+)?(?:[\w.#_-]+)?/;

/** Returns true when the URL points to a Dailymotion video. */
export function isDailymotionUrl(url: string): boolean {
	return DAILYMOTION_REGEX.test(url);
}

function getVideoId(url: string): string | null {
	const match = url.match(DAILYMOTION_REGEX);
	return match ? match[1] : null;
}

interface DailymotionPlayerProps {
	url: string;
	playing: boolean;
	muted: boolean;
	volume: number;
	width: string | number;
	height: string | number;
	className?: string;
	style?: React.CSSProperties;
	onReady?: () => void;
	onStart?: () => void;
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onError?: (error: unknown) => void;
	onDuration?: (duration: number) => void;
	onProgress?: (state: ProgressState) => void;
}

export interface DailymotionPlayerHandle {
	seekTo: (amount: number) => void;
}

/**
 * Standalone Dailymotion player using the geo.dailymotion.com iframe embed.
 *
 * Because the Dailymotion postMessage API is deprecated and the new SDK
 * requires a partner account Player ID, this component simulates playback
 * state using the public REST API for duration and a client-side timer for
 * elapsed time.  All commands (play, pause, seek, mute, volume) are no-ops.
 *
 * Exposes a `seekTo` method via ref (no-op) matching the interface
 * MusicPlayer expects from ReactPlayer.
 */
export const DailymotionPlayer = forwardRef<
	DailymotionPlayerHandle,
	DailymotionPlayerProps
>(function DailymotionPlayer(props, ref) {
	const {
		url,
		playing,
		width,
		height,
		className,
		style,
		onReady,
		onStart,
		onPlay,
		onPause,
		onEnded,
		onError,
		onDuration,
		onProgress,
	} = props;

	const durationRef = useRef(0);
	const currentTimeRef = useRef(0);
	const startedRef = useRef(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// seekTo is intentionally a no-op — seeking requires the partner SDK.
	useImperativeHandle(ref, () => ({ seekTo: () => {} }), []);

	// On url change: reset state, fetch duration, show warning toast.
	// biome-ignore lint/correctness/useExhaustiveDependencies: callbacks are stable handler refs; url is the intentional trigger
	useEffect(() => {
		const videoId = getVideoId(url);
		if (!videoId) return;

		// Reset per-video state.
		durationRef.current = 0;
		currentTimeRef.current = 0;
		startedRef.current = false;
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		toast.warning("Dailymotion playback controls are limited", {
			description:
				"Pause, seek, mute and volume controls have no effect on Dailymotion videos. The next track will start automatically when the estimated duration elapses.",
			duration: 8000,
		});

		let cancelled = false;
		fetch(
			`https://api.dailymotion.com/video/${videoId}?fields=id,duration`,
		)
			.then((res) => {
				if (!res.ok) throw new Error(`Dailymotion API error: ${res.status}`);
				return res.json() as Promise<{ id: string; duration: number }>;
			})
			.then((data) => {
				if (cancelled) return;
				durationRef.current = data.duration;
				onDuration?.(data.duration);
				onReady?.();
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				onError?.(err);
			});

		return () => {
			cancelled = true;
		};
	}, [url]);

	// Fire onStart/onPlay/onPause when the playing prop changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: callbacks are stable handler refs; playing is the intentional trigger
	useEffect(() => {
		if (playing) {
			if (!startedRef.current) {
				startedRef.current = true;
				onStart?.();
			}
			onPlay?.();
		} else {
			onPause?.();
		}
	}, [playing]);

	// Advance the simulated clock while playing; fire onEnded when done.
	// biome-ignore lint/correctness/useExhaustiveDependencies: callbacks are stable handler refs; playing is the intentional trigger
	useEffect(() => {
		if (!playing) {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		intervalRef.current = setInterval(() => {
			const dur = durationRef.current;
			if (dur <= 0) return;

			currentTimeRef.current += 0.5;

			if (currentTimeRef.current >= dur) {
				currentTimeRef.current = 0;
				startedRef.current = false;
				if (intervalRef.current !== null) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
				onEnded?.();
				return;
			}

			onProgress?.({
				played: currentTimeRef.current / dur,
				playedSeconds: currentTimeRef.current,
				loaded: 1,
				loadedSeconds: dur,
			});
		}, 500);

		return () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [playing]);

	const videoId = getVideoId(url);
	if (!videoId) return null;

	const src = `https://geo.dailymotion.com/player.html?video=${videoId}`;

	return (
		<iframe
			src={src}
			width={width}
			height={height}
			className={className}
			allow="autoplay"
			allowFullScreen
			title="Dailymotion Player"
			style={{ border: 0, ...style }}
		/>
	);
});

import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
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
 * Standalone Dailymotion player using the geo.dailymotion.com iframe embed
 * and its postMessage API (replaces the deprecated DM.player SDK).
 *
 * Exposes a `seekTo` method via ref, matching the interface MusicPlayer
 * expects from ReactPlayer.
 */
export const DailymotionPlayer = forwardRef<
	DailymotionPlayerHandle,
	DailymotionPlayerProps
>(function DailymotionPlayer(props, ref) {
	const {
		url,
		playing,
		muted,
		volume,
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

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const durationRef = useRef(0);
	const currentTimeRef = useRef(0);
	const secondsLoadedRef = useRef(0);
	const readyRef = useRef(false);
	const startedRef = useRef(false);
	const playingRef = useRef(playing);
	const mutedRef = useRef(muted);
	const volumeRef = useRef(volume);

	// Keep refs in sync with props
	useEffect(() => {
		playingRef.current = playing;
	}, [playing]);
	useEffect(() => {
		mutedRef.current = muted;
	}, [muted]);
	useEffect(() => {
		volumeRef.current = volume;
	}, [volume]);

	const sendCommand = useCallback((command: Record<string, unknown>) => {
		const iframe = iframeRef.current;
		if (iframe?.contentWindow) {
			iframe.contentWindow.postMessage(command, "https://geo.dailymotion.com");
		}
	}, []);

	useImperativeHandle(
		ref,
		() => ({
			seekTo(amount: number) {
				const dur = durationRef.current;
				// Callers pass a fraction (0–1); convert to seconds.
				const time = amount * dur;
				sendCommand({ command: "seek", time });
			},
		}),
		[sendCommand],
	);

	// Sync playing prop
	useEffect(() => {
		if (!readyRef.current) return;
		sendCommand({ command: playing ? "play" : "pause" });
	}, [playing, sendCommand]);

	// Sync muted prop
	useEffect(() => {
		if (!readyRef.current) return;
		sendCommand({ command: "setMuted", muted });
	}, [muted, sendCommand]);

	// Sync volume prop
	useEffect(() => {
		if (!readyRef.current) return;
		sendCommand({ command: "setVolume", volume });
	}, [volume, sendCommand]);

	// postMessage listener
	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== "https://geo.dailymotion.com") return;
			const iframe = iframeRef.current;
			if (!iframe || event.source !== iframe.contentWindow) return;

			const data = event.data as Record<string, unknown>;
			if (!data || typeof data.event !== "string") return;

			switch (data.event) {
				case "apiready":
					readyRef.current = true;
					sendCommand({ command: "setMuted", muted: mutedRef.current });
					sendCommand({ command: "setVolume", volume: volumeRef.current });
					if (playingRef.current) {
						sendCommand({ command: "play" });
					}
					onReady?.();
					break;
				case "play":
					if (!startedRef.current) {
						startedRef.current = true;
						onStart?.();
					}
					onPlay?.();
					break;
				case "pause":
					onPause?.();
					break;
				case "end":
					startedRef.current = false;
					onEnded?.();
					break;
				case "timeupdate":
					if (typeof data.videoCurrentTime === "number") {
						currentTimeRef.current = data.videoCurrentTime;
						const dur = durationRef.current;
						if (dur > 0) {
							onProgress?.({
								played: currentTimeRef.current / dur,
								playedSeconds: currentTimeRef.current,
								loaded: secondsLoadedRef.current / dur,
								loadedSeconds: secondsLoadedRef.current,
							});
						}
					}
					break;
				case "durationchange":
					if (typeof data.videoDuration === "number") {
						durationRef.current = data.videoDuration;
						onDuration?.(durationRef.current);
					}
					break;
				case "progress":
					if (typeof data.videoBufferedTime === "number") {
						secondsLoadedRef.current = data.videoBufferedTime;
					}
					break;
				case "error":
					onError?.(data);
					break;
			}
		}

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [
		sendCommand,
		onReady,
		onStart,
		onPlay,
		onPause,
		onEnded,
		onError,
		onDuration,
		onProgress,
	]);

	const videoId = getVideoId(url);
	if (!videoId) return null;

	const src = `https://geo.dailymotion.com/player.html?video=${videoId}`;

	return (
		<iframe
			ref={iframeRef}
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

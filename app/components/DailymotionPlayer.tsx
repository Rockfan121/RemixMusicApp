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

	// Reset player state when the URL changes (new video loaded into the iframe).
	// url is the trigger; the body only resets refs which Biome doesn't track.
	// biome-ignore lint/correctness/useExhaustiveDependencies: url is the intentional trigger
	useEffect(() => {
		readyRef.current = false;
		startedRef.current = false;
		durationRef.current = 0;
		currentTimeRef.current = 0;
		secondsLoadedRef.current = 0;
	}, [url]);

	const sendCommand = useCallback((command: Record<string, unknown>) => {
		const iframe = iframeRef.current;
		if (iframe?.contentWindow) {
			// Commands must be sent as JSON strings; plain objects are silently
			// ignored by the Dailymotion player.  Origin "*" is used because the
			// player's receiver lives at https://www.dailymotion.com, not
			// https://geo.dailymotion.com.
			iframe.contentWindow.postMessage(JSON.stringify(command), "*");
		}
	}, []);

	useImperativeHandle(
		ref,
		() => ({
			seekTo(amount: number) {
				const dur = durationRef.current;
				// Callers pass a fraction (0–1); convert to seconds.
				const time = amount * dur;
				// Seek command uses a parameters array per the postMessage API spec.
				sendCommand({ command: "seek", parameters: [time] });
			},
		}),
		[sendCommand],
	);

	// Sync playing prop
	useEffect(() => {
		if (!readyRef.current) return;
		sendCommand({ command: playing ? "play" : "pause" });
	}, [playing, sendCommand]);

	// Sync muted prop — use the "muted" command with a parameters array.
	useEffect(() => {
		if (!readyRef.current) return;
		sendCommand({ command: "muted", parameters: [muted] });
	}, [muted, sendCommand]);

	// Sync volume prop — use the "volume" command with a parameters array.
	useEffect(() => {
		if (!readyRef.current) return;
		sendCommand({ command: "volume", parameters: [volume] });
	}, [volume, sendCommand]);

	// postMessage listener
	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			// Accept messages from either Dailymotion origin. Nested player frames
			// (player engine, ads, etc.) may use www.dailymotion.com as their origin.
			if (
				event.origin !== "https://geo.dailymotion.com" &&
				event.origin !== "https://www.dailymotion.com"
			) {
				return;
			}

			// Do NOT check event.source here. Dailymotion's player internally uses
			// nested iframes and postMessages events from those child frames. Their
			// contentWindow differs from iframeRef.current.contentWindow, so a strict
			// source check would filter out apiready, timeupdate, and every other
			// event, causing all commands to be silently dropped.

			// Parse event data — some implementations send a JSON string rather than
			// a plain object.
			let data: Record<string, unknown>;
			if (event.data !== null && typeof event.data === "object") {
				data = event.data as Record<string, unknown>;
			} else if (typeof event.data === "string") {
				try {
					const parsed: unknown = JSON.parse(event.data);
					if (parsed === null || typeof parsed !== "object") return;
					data = parsed as Record<string, unknown>;
				} catch {
					return; // ignore malformed JSON
				}
			} else {
				return;
			}

			if (typeof data.event !== "string") return;

			switch (data.event) {
				case "apiready":
					readyRef.current = true;
					sendCommand({ command: "muted", parameters: [mutedRef.current] });
					sendCommand({ command: "volume", parameters: [volumeRef.current] });
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
					// The postMessage API uses `time` for current time (seconds).
					if (typeof data.time === "number") {
						currentTimeRef.current = data.time;
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
					// The postMessage API uses `duration` for the video duration (seconds).
					if (typeof data.duration === "number") {
						durationRef.current = data.duration;
						onDuration?.(durationRef.current);
					}
					break;
				case "progress":
					// The postMessage API uses `time` for buffered time (same field as timeupdate).
					if (typeof data.time === "number") {
						secondsLoadedRef.current = data.time;
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

	const src = `https://www.dailymotion.com/embed/video/${videoId}?api=postMessage`;

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

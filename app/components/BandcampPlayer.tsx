import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useBandcampTrack } from "@/components/use-bandcamp-track";
import type { BandcampPlayerHandle } from "@/types/bandcamp";
import type { ProgressState } from "@/types/progress-state-type";

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

		// Store callbacks in refs so effects that read them don't need them as
		// dependencies. This prevents a re-fetch every time the parent re-renders
		// and passes new (non-memoised) function references.
		const onReadyRef = useRef(onReady);
		const onPlayRef = useRef(onPlay);
		const onPauseRef = useRef(onPause);
		const onEndedRef = useRef(onEnded);
		const onProgressRef = useRef(onProgress);
		const onDurationRef = useRef(onDuration);
		onReadyRef.current = onReady;
		onPlayRef.current = onPlay;
		onPauseRef.current = onPause;
		onEndedRef.current = onEnded;
		onProgressRef.current = onProgress;
		onDurationRef.current = onDuration;

		const { trackData, isLoading } = useBandcampTrack(url, onError);

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
						if (!audio?.duration) return;
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
						onError?.(e);
					}}
					style={{ display: "none" }}
				/>
				<img
					src={trackData.coverArt}
					alt={trackData.trackTitle}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "contain",
					}}
				/>
			</>
		);
	},
);

BandcampPlayer.displayName = "BandcampPlayer";

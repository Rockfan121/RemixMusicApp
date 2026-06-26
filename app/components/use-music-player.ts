import type { BaseSyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type ReactPlayer from "react-player";
import { toast } from "sonner";
import type { BandcampPlayerHandle } from "@/components/BandcampPlayer";
import { getMusicServiceAndUrl } from "@/helpers/media-url";
import { sleep } from "@/helpers/timeouts";
import type { Track } from "@/types/openwhyd-types";
import type { ProgressState } from "@/types/progress-state-type";

type LoopMode = 0 | 1 | 2; //0=off, 1=playlist, 2=track

export interface MusicPlayerProps {
	playlist: Array<Track>;
	firstTrackNo: number;
	playRequestId: number;
}

export function useMusicPlayer({
	playlist,
	firstTrackNo,
	playRequestId,
}: MusicPlayerProps) {
	const [currentSongIndex, setCurrentSongIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [howLooped, setHowLooped] = useState<LoopMode>(1);
	const [isMuted, setIsMuted] = useState(false);
	const [played, setPlayed] = useState(0);
	const [duration, setDuration] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [hasWindow, setHasWindow] = useState(false);
	const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
	// Tracks the last playRequestId that was synced to currentSongIndex during render.
	// When it differs from the incoming playRequestId, we synchronously reset
	// currentSongIndex to firstTrackNo so that ReactPlayer never briefly renders
	// with a stale index into the new playlist (which would fire a spurious onError).
	const [syncedPlayRequestId, setSyncedPlayRequestId] = useState(playRequestId);
	if (syncedPlayRequestId !== playRequestId) {
		setSyncedPlayRequestId(playRequestId);
		setCurrentSongIndex(firstTrackNo);
	}

	const playerRef = useRef<ReactPlayer | null>(null);
	const bandcampPlayerRef = useRef<BandcampPlayerHandle | null>(null);

	// --- Refs for values needed in async callbacks (avoids stale closures) ---
	const isMutedRef = useRef(isMuted);
	isMutedRef.current = isMuted;

	const currentSongIndexRef = useRef(currentSongIndex);
	currentSongIndexRef.current = currentSongIndex;

	const playlistRef = useRef(playlist);
	playlistRef.current = playlist;

	const playRequestIdRef = useRef(playRequestId);
	playRequestIdRef.current = playRequestId;

	const howLoopedRef = useRef(howLooped);
	howLoopedRef.current = howLooped;

	const isPlayingRef = useRef(isPlaying);
	isPlayingRef.current = isPlaying;

	const seekingRef = useRef(seeking);
	seekingRef.current = seeking;

	const lastActionTimeRef = useRef(Date.now());
	// -------------------------------------------------------------------------

	const seekPlayer = useCallback((fraction: number) => {
		if (bandcampPlayerRef.current) {
			bandcampPlayerRef.current.seekTo(fraction);
		} else if (playerRef.current !== null) {
			playerRef.current.seekTo(fraction);
		}
	}, []);

	const muteSyncSeqRef = useRef(0);

	const syncIsMuted = useCallback(async () => {
		const shouldBeMuted = isMutedRef.current;

		if (bandcampPlayerRef.current) {
			// Bandcamp player — backed by HTMLAudioElement, synchronous mute control
			bandcampPlayerRef.current.setMuted(shouldBeMuted);
			return;
		}

		const internalPlayer = playerRef.current?.getInternalPlayer();
		if (internalPlayer) {
			if (typeof internalPlayer.isMuted === "function") {
				// YouTube player
				if (shouldBeMuted) {
					internalPlayer.mute();
				} else {
					internalPlayer.unMute();
				}
			} else if (typeof internalPlayer.getMuted === "function") {
				// Vimeo player
				if (typeof internalPlayer.setMuted === "function") {
					const syncSeq = ++muteSyncSeqRef.current;
					await (internalPlayer.setMuted(shouldBeMuted) as Promise<void>);
					if (syncSeq !== muteSyncSeqRef.current) {
						await (internalPlayer.setMuted(
							isMutedRef.current,
						) as Promise<void>);
					}
				}
			} else if (typeof internalPlayer.setVolume === "function") {
				// SoundCloud player — no native mute function, use volume instead
				if (shouldBeMuted) {
					internalPlayer.setVolume(0);
				} else {
					internalPlayer.setVolume(100);
				}
			}
		}
	}, []);

	// Mount guard:
	const abortRef = useRef<AbortController | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: playRequestId is needed for refreshment every time a user clicks a track (even if it's the same track again)
	useEffect(() => {
		if (typeof document !== "undefined") {
			abortRef.current?.abort();
			setHasWindow(true);
			// setCurrentSongIndex is intentionally omitted here: the render-time
			// syncedPlayRequestId guard above already resets it synchronously,
			// so by the time this effect runs the value is already correct.
			if (playlistRef.current.length > 0) {
				setPlayed(0);
				setIsPlaying(true);
				seekPlayer(0);
			}
		}
	}, [playRequestId]);

	const togglePlayPause = () => setIsPlaying((prev) => !prev);
	const toggleLooped = () =>
		setHowLooped((prev) => ((prev + 1) % 3) as LoopMode);
	const toggleMuted = () => setIsMuted((prev) => !prev);
	const toggleBrowserFullscreen = () => setIsBrowserFullscreen((prev) => !prev);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	const changeSong = useCallback(
		async (
			getNextIndex: (prevIndex: number, playlistLength: number) => number,
		) => {
			abortRef.current?.abort(); // cancel any previous in-flight change
			const ctrl = new AbortController();
			abortRef.current = ctrl;
			setPlayed(0);

			try {
				await sleep(200, ctrl.signal);
				setCurrentSongIndex((prevIndex) =>
					getNextIndex(prevIndex, playlistRef.current.length),
				);
				setIsPlaying(true);
				lastActionTimeRef.current = Date.now();
			} catch {
				/*aborted */
			}
		},
		[],
	);

	const nextSong = useCallback(async () => {
		await changeSong((prevIndex, playlistLength) => {
			if (playlistLength === 0) return 0;
			return prevIndex + 1 < playlistLength ? prevIndex + 1 : 0;
		});
	}, [changeSong]);

	const someOtherSong = useCallback(
		async (index: number) => {
			await changeSong((_prevIndex, playlistLength) => {
				if (playlistLength === 0) return 0;
				if (index < 0) return 0;
				if (index >= playlistLength) return playlistLength - 1;
				return index;
			});
		},
		[changeSong],
	);

	const prevSong = useCallback(async () => {
		await changeSong((prevIndex, playlistLength) => {
			if (playlistLength === 0) return 0;
			return prevIndex - 1 >= 0 ? prevIndex - 1 : playlistLength - 1;
		});
	}, [changeSong]);

	// Use refs for all values read after the await — the 1 second delay
	// makes stale closures on currentSongIndex and playlist a real risk.
	const handleError = useCallback(async () => {
		const indexAtError = currentSongIndexRef.current;
		const currentTrack = playlistRef.current[indexAtError];
		const playRequestAtError = playRequestIdRef.current;

		console.log(
			`onError - Track "${currentTrack?.name ?? "Unknown"}" can't be played`,
		);
		// Snapshot synchronously before the await — safe to use closure values here

		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;

		toast.error(`Track "${currentTrack?.name ?? "Unknown"}" can't be played`, {
			duration: 4000,
		});

		try {
			await sleep(1000, ctrl.signal);
		} catch (error) {
			console.log(`Error in player: ${error}`);
			return;
		}

		if (
			ctrl.signal.aborted ||
			playRequestAtError !== playRequestIdRef.current ||
			indexAtError !== currentSongIndexRef.current
		) {
			return;
		}

		// Re-read from refs after the await to get the freshest values
		const freshIndex = currentSongIndexRef.current;
		const freshPlaylist = playlistRef.current;
		if (freshPlaylist.length === 0) {
			return;
		}

		const errantUrl = getMusicServiceAndUrl(
			freshPlaylist[freshIndex]?.eId ?? "",
		);

		let newIndex = freshIndex;
		const startIndex = newIndex;
		let newUrl = getMusicServiceAndUrl(freshPlaylist[newIndex]?.eId ?? "");

		while (errantUrl === newUrl) {
			newIndex = newIndex + 1 < freshPlaylist.length ? newIndex + 1 : 0;
			newUrl = getMusicServiceAndUrl(freshPlaylist[newIndex]?.eId ?? "");
			if (newIndex === startIndex) break; // full-loop guard — avoid infinite loop
		}
		if (newIndex === startIndex) return;
		someOtherSong(newIndex);
	}, [someOtherSong]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: isMuted have to fire this hook in order to make it working correctly
	useEffect(() => {
		if (!hasWindow) return;
		void syncIsMuted();
	}, [hasWindow, isMuted, syncIsMuted]);

	const handlePlay = useCallback(() => {
		setIsPlaying(true);
		lastActionTimeRef.current = Date.now();
	}, []);

	const handlePause = useCallback(() => {
		setIsPlaying(false);
	}, []);

	const handleEnded = useCallback(() => {
		const idx = currentSongIndexRef.current;
		const pl = playlistRef.current;
		if (idx + 1 < pl.length || howLoopedRef.current > 0) nextSong();
		else handlePause();
	}, [handlePause, nextSong]);

	const handleSeekMouseDown = () => setSeeking(true);

	const handleSeekChange = (e: BaseSyntheticEvent) => {
		setPlayed(Number.parseFloat(e.target.value));
	};

	const handleSeekMouseUp = (e: BaseSyntheticEvent) => {
		setSeeking(false);
		seekPlayer(Number.parseFloat(e.target.value));
	};

	const handleProgress = useCallback(
		(progress: ProgressState) => {
			lastActionTimeRef.current = Date.now();
			if (!seeking) {
				setPlayed(progress.played);
			}
		},
		[seeking],
	);

	const handleDuration = useCallback((d: number) => setDuration(d), []);

	const currentTrack = useMemo(
		() => playlist[currentSongIndex] ?? null,
		[playlist, currentSongIndex],
	);

	const currentUrl = useMemo(
		() => (currentTrack ? getMusicServiceAndUrl(currentTrack.eId) : ""),
		[currentTrack],
	);

	// Watchdog Timer: Detects silent stalls or stuck SDKs (e.g. Dailymotion freezes, YouTube iframe hangs).
	// If isPlaying is true but no progress or actions occur within 15s, fire handleError to auto-skip.
	// This complements Vercel's 10s timeout without causing false positives on slow networks.
	useEffect(() => {
		const interval = setInterval(() => {
			if (isPlayingRef.current && !seekingRef.current) {
				if (Date.now() - lastActionTimeRef.current > 11000) {
					console.log("Watchdog triggered: Track stuck for 15s, skipping...");
					void handleError();
					lastActionTimeRef.current = Date.now(); // Reset to prevent rapid refiring while skipping
				}
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [handleError]);

	return {
		bandcampPlayerRef,
		currentSongIndex,
		duration,
		currentUrl,
		currentTrack,
		syncIsMuted,
		handleDuration,
		handleEnded,
		handleError,
		handlePause,
		handlePlay,
		handleProgress,
		handleSeekChange,
		handleSeekMouseDown,
		handleSeekMouseUp,
		hasWindow,
		howLooped,
		isMuted,
		isPlaying,
		isBrowserFullscreen,
		nextSong,
		playerRef,
		played,
		prevSong,
		toggleLooped,
		toggleMuted,
		togglePlayPause,
		toggleBrowserFullscreen,
	};
}

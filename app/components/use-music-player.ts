import type { BaseSyntheticEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
	playlistUrl: string;
}

export function useMusicPlayer({
	playlist,
	firstTrackNo,
	playRequestId,
	playlistUrl: _playlistUrl,
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
			setCurrentSongIndex(firstTrackNo);
			if (playlist.length > 0) {
				setPlayed(0);
				setIsPlaying(true);
				seekPlayer(0);
			}
		}
	}, [firstTrackNo, playRequestId, playlist]);

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
			//setPlayed(0);

			try {
				await sleep(200, ctrl.signal);
				setCurrentSongIndex((prevIndex) =>
					getNextIndex(prevIndex, playlistRef.current.length),
				);
			} catch {
				/*aborted */
			}
		},
		[],
	);

	const nextSong = async () => {
		await changeSong((prevIndex, playlistLength) => {
			if (playlistLength === 0) return 0;
			return prevIndex + 1 < playlistLength ? prevIndex + 1 : 0;
		});
	};

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

	const prevSong = async () => {
		await changeSong((prevIndex, playlistLength) => {
			if (playlistLength === 0) return 0;
			return prevIndex - 1 >= 0 ? prevIndex - 1 : playlistLength - 1;
		});
	};

	// Use refs for all values read after the await — the 1 second delay
	// makes stale closures on currentSongIndex and playlist a real risk.
	const handleError = useCallback(async () => {
		console.log("onError");
		// Snapshot synchronously before the await — safe to use closure values here
		const indexAtError = currentSongIndexRef.current;
		const currentTrack = playlistRef.current[indexAtError];
		const playRequestAtError = playRequestIdRef.current;

		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;

		toast.error(`Track "${currentTrack?.name ?? "Unknown"}" can't be played`, {
			duration: 4000,
		});

		try {
			await sleep(1000, ctrl.signal);
		} catch {
			return;
		}

		if (
			ctrl.signal.aborted ||
			playRequestAtError !== playRequestIdRef.current
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

	const handleReactPlayerStart = () => {
		syncIsMuted();
	};

	const handleBandcampReady = () => {
		syncIsMuted();
	};

	useEffect(() => {
		if (!hasWindow) return;
		void syncIsMuted();
	}, [hasWindow, syncIsMuted]);

	const handlePlay = () => {
		setIsPlaying(true);
	};

	const handlePause = () => {
		setIsPlaying(false);
	};

	const handleEnded = () => {
		if (currentSongIndex + 1 < playlist.length || howLooped > 0) nextSong();
		else handlePause();
	};

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
			if (!seeking) {
				setPlayed(progress.played);
			}
		},
		[seeking],
	);

	const handleDuration = useCallback((d: number) => setDuration(d), []);

	const getUrl = (index: number) => {
		let result = "";
		if (playlist.length > index) {
			result = getMusicServiceAndUrl(playlist[index].eId);
		}
		return result;
	};

	const getCurrentUrl = () => getUrl(currentSongIndex);

	return {
		bandcampPlayerRef,
		currentSongIndex,
		duration,
		getCurrentUrl,
		handleBandcampReady,
		handleDuration,
		handleEnded,
		handleError,
		handlePause,
		handlePlay,
		handleProgress,
		handleSeekChange,
		handleSeekMouseDown,
		handleSeekMouseUp,
		handleReactPlayerStart,
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

import type { BaseSyntheticEvent } from "react";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import type ReactPlayer from "react-player";
import screenfull from "screenfull";
import { toast } from "sonner";
import type { BandcampPlayerHandle } from "@/components/BandcampPlayer";
import { getMusicServiceAndUrl } from "@/helpers/media-url";
import { sleep, timeout1000, timeout1500 } from "@/helpers/timeouts";
import type { Track } from "@/types/openwhyd-types";
import type { ProgressState } from "@/types/progress-state-type";

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
	const [howLooped, setHowLooped] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [isFullscreenable, setIsFullscreenable] = useState(true);
	const [played, setPlayed] = useState(0);
	const [duration, setDuration] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [hasWindow, setHasWindow] = useState(false);

	const playerRef = useRef<ReactPlayer | null>(null);
	const bandcampPlayerRef = useRef<BandcampPlayerHandle | null>(null);

	const isMutedRef = useRef(isMuted);
	isMutedRef.current = isMuted;

	const currentSongIndexRef = useRef(currentSongIndex);
	currentSongIndexRef.current = currentSongIndex;

	const playlistRef = useRef(playlist);
	playlistRef.current = playlist;

	const seekPlayer = useCallback((fraction: number) => {
		if (bandcampPlayerRef.current) {
			bandcampPlayerRef.current.seekTo(fraction);
		} else if (playerRef.current !== null) {
			playerRef.current.seekTo(fraction);
		}
	}, []);

	async function syncIsMuted() {
		const shouldBeMuted = isMutedRef.current;

		if (bandcampPlayerRef.current) {
			bandcampPlayerRef.current.setMuted(shouldBeMuted);
			return;
		}

		const internalPlayer = playerRef.current?.getInternalPlayer();
		if (internalPlayer) {
			if (typeof internalPlayer.isMuted === "function") {
				if (shouldBeMuted) {
					internalPlayer.mute();
				} else {
					internalPlayer.unMute();
				}
			} else if (typeof internalPlayer.getMuted === "function") {
				if (typeof internalPlayer.setMuted === "function") {
					await (internalPlayer.setMuted(shouldBeMuted) as Promise<void>);
				}
			} else if (typeof internalPlayer.setVolume === "function") {
				if (shouldBeMuted) {
					internalPlayer.setVolume(0);
				} else {
					internalPlayer.setVolume(100);
				}
			}
		}
	}

	const startPlayingFromBeginning = useCallback(() => {
		setPlayed(0);
		setIsPlaying(true);
		seekPlayer(0);
	}, [seekPlayer]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: playRequestId is needed for refreshment every time a user clicks a track (even if it's the same track again)
	useEffect(() => {
		if (typeof document !== "undefined") {
			setHasWindow(true);
			setCurrentSongIndex(firstTrackNo);
			if (playlist.length > 0) startPlayingFromBeginning();
		}
	}, [firstTrackNo, playRequestId, startPlayingFromBeginning, playlist]);

	const togglePlayPause = () => setIsPlaying((prev) => !prev);
	const toggleLooped = () => setHowLooped((prev) => (prev + 1) % 3);
	const toggleMuted = () => setIsMuted((prev) => !prev);

	const abortRef = useRef<AbortController | null>(null);
	useEffect(() => {
		return () => abortRef.current?.abort();
	}, []);

	const changeSong = async (getNextIndex: (prevIndex: number) => number) => {
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		setIsPlaying(false);
		setPlayed(0);

		try {
			await sleep(200, ctrl.signal);
			setCurrentSongIndex((prevIndex) => getNextIndex(prevIndex));
			await sleep(50, ctrl.signal);
			setIsPlaying(true);
		} catch {
			/*aborted */
		}
	};

	const nextSong = async () => {
		await changeSong((prevIndex) =>
			prevIndex + 1 < playlist.length ? prevIndex + 1 : 0,
		);
	};

	const someOtherSong = async (index: number) => {
		await changeSong(() => index);
	};

	const prevSong = async () => {
		await changeSong((prevIndex) =>
			prevIndex - 1 >= 0 ? prevIndex - 1 : playlist.length - 1,
		);
	};

	const handleError = async () => {
		console.log("onError");
		const indexAtError = currentSongIndexRef.current;
		const currentTrack = playlistRef.current[indexAtError];
		toast.error(`Track "${currentTrack?.name ?? "Unknown"}" can't be played`, {
			duration: 4000,
		});
		await new Promise(timeout1000);

		const freshIndex = currentSongIndexRef.current;
		const freshPlaylist = playlistRef.current;
		const errantUrl = getMusicServiceAndUrl(
			freshPlaylist[freshIndex]?.eId ?? "",
		);

		let newIndex = freshIndex;
		const startIndex = newIndex;
		let newUrl = getMusicServiceAndUrl(freshPlaylist[newIndex]?.eId ?? "");

		while (errantUrl === newUrl) {
			newIndex = newIndex + 1 < freshPlaylist.length ? newIndex + 1 : 0;
			newUrl = getMusicServiceAndUrl(freshPlaylist[newIndex]?.eId ?? "");
			if (newIndex === startIndex) break;
		}
		someOtherSong(newIndex);
	};

	const handleStart = () => {
		setIsFullscreenable(true);
		syncIsMuted();
	};

	const handleBandcampReady = () => {
		setIsFullscreenable(false);
		syncIsMuted();
	};

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

	const handleProgress = (progress: ProgressState) => {
		if (!seeking) {
			setPlayed(progress.played);
		}
	};

	const handleDuration = (nextDuration: number) => setDuration(nextDuration);

	const handleClickFullscreen = async () => {
		const playerElement = hasWindow
			? document.querySelector(".react-player")
			: null;
		if (playerElement) {
			toast.message(
				createElement(
					"div",
					{ className: "font-bold text-2xl text-ring" },
					"To leave fullscreen, press ",
					createElement("span", { className: "italic" }, "Esc"),
					" on keyboard.",
				),
				{
					duration: 1500,
				},
			);
			await new Promise(timeout1500);
			screenfull.request(playerElement);
		}
	};

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
		handleClickFullscreen,
		handleDuration,
		handleEnded,
		handleError,
		handlePause,
		handlePlay,
		handleProgress,
		handleSeekChange,
		handleSeekMouseDown,
		handleSeekMouseUp,
		handleStart,
		hasWindow,
		howLooped,
		isFullscreenable,
		isMuted,
		isPlaying,
		nextSong,
		playerRef,
		played,
		prevSong,
		toggleLooped,
		toggleMuted,
		togglePlayPause,
	};
}

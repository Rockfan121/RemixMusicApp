import {
	EnterFullScreenIcon,
	ListBulletIcon,
	LoopIcon,
	PauseIcon,
	PlayIcon,
	SpeakerLoudIcon,
	SpeakerOffIcon,
	TrackNextIcon,
	TrackPreviousIcon,
} from "@radix-ui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Link } from "react-router";
import screenfull from "screenfull";
import { toast } from "sonner";
import type { BandcampPlayerHandle } from "@/components/BandcampPlayer";
import { BandcampPlayer } from "@/components/BandcampPlayer";
import { Button } from "@/components/ui/button";
import { getMusicServiceAndUrl } from "@/helpers/media-url";
import { sleep, timeout1500 } from "@/helpers/timeouts";
import { cn } from "@/lib/styles";
import type { Track } from "@/types/openwhyd-types";
import type { ProgressState } from "@/types/progress-state-type";
import DailymotionSkipper from "./DailymotionSkipper";
import { Duration } from "./duration";

interface MusicPlayerProps {
	playlist: Array<Track>;
	firstTrackNo: number;
	playRequestId: number;
	playlistUrl: string;
}
/**
 * Component wrapping ReactPlayer, playing music from some playlist
 */

const isBandcampUrl = (url: string) => url.includes(".bandcamp.com/track/");

const MATCH_URL_DAILYMOTION =
	/(?:dailymotion\.com(?:\/embed)?\/video|dai\.ly)\/([a-zA-Z0-9]+)/;

export function MusicPlayer({
	playlist,
	firstTrackNo,
	playRequestId,
	playlistUrl,
}: MusicPlayerProps) {
	const [currentSongIndex, setCurrentSongIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [howLooped, setHowLooped] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [isFullscreenable, setIsFullscreenable] = useState(true);
	const [played, setPlayed] = useState(0);
	const [duration, setDuration] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [hasWindow, setHasWindow] = useState(false); //to make sure it's the client side

	const playerRef = useRef<ReactPlayer | null>(null);
	const bandcampPlayerRef = useRef<BandcampPlayerHandle | null>(null);

	// --- Refs for values needed in async callbacks (avoids stale closures) ---

	// isMuted: read by syncIsMuted() which is async (Vimeo path has an await)
	const isMutedRef = useRef(isMuted);
	isMutedRef.current = isMuted;

	// currentSongIndex: read by handleError() after await new Promise(timeout1000)
	const currentSongIndexRef = useRef(currentSongIndex);
	currentSongIndexRef.current = currentSongIndex;

	// playlist: read by handleError() via getUrl() after await new Promise(timeout1000)
	const playlistRef = useRef(playlist);
	playlistRef.current = playlist;

	// playRequestId: used to avoid applying delayed error handling to a newer play request
	const playRequestIdRef = useRef(playRequestId);
	playRequestIdRef.current = playRequestId;

	// -------------------------------------------------------------------------

	function isDailymotionUrl(url: string) {
		const match = url.match(MATCH_URL_DAILYMOTION);
		return !(match === null);
	}

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
				// SoundCloud player — no native mute API, use volume instead
				if (shouldBeMuted) {
					internalPlayer.setVolume(0);
				} else {
					internalPlayer.setVolume(100);
				}
			}
		}
	}, []);

	const startPlayingFromBeginning = useCallback(() => {
		setPlayed(0);
		setIsPlaying(true);
		seekPlayer(0);
	}, [seekPlayer]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: playRequestId is needed for refreshment every time a user clicks a track (even if it's the same track again)
	useEffect(() => {
		if (typeof document !== "undefined") {
			abortRef.current?.abort();
			errorAbortRef.current?.abort();
			setHasWindow(true);
			setCurrentSongIndex(firstTrackNo);
			if (playlist.length > 0) startPlayingFromBeginning();
		}
	}, [firstTrackNo, playRequestId, startPlayingFromBeginning, playlist]);

	const togglePlayPause = () => setIsPlaying((prev) => !prev);
	const toggleLooped = () => setHowLooped((prev) => (prev + 1) % 3);
	const toggleMuted = () => setIsMuted((prev) => !prev);

	// Mount guard:
	const abortRef = useRef<AbortController | null>(null);
	const errorAbortRef = useRef<AbortController | null>(null);
	useEffect(() => {
		return () => {
			abortRef.current?.abort();
			errorAbortRef.current?.abort();
		};
	}, []);

	// Cycle isPlaying false → true so ReactPlayer always sees a prop
	// transition on the new URL. Without this, isPlaying stays true throughout,
	// React diffs detect no change, and some providers (especially YouTube) silently
	// skip calling .play() after onEnded puts the internal player in ENDED state.
	const changeSong = useCallback(
		async (
			getNextIndex: (prevIndex: number, playlistLength: number) => number,
		) => {
			abortRef.current?.abort(); // cancel any previous in-flight change
			const ctrl = new AbortController();
			abortRef.current = ctrl;
			setIsPlaying(false);
			setPlayed(0);

			try {
				await sleep(200, ctrl.signal);
				setCurrentSongIndex((prevIndex) =>
					getNextIndex(prevIndex, playlistRef.current.length),
				);
				// Let React flush the new url + playing=false before flipping to true
				await sleep(200, ctrl.signal);
				setIsPlaying(true);
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
		toast.error(`Track "${currentTrack?.name ?? "Unknown"}" can't be played`, {
			duration: 4000,
		});

		errorAbortRef.current?.abort();
		const ctrl = new AbortController();
		errorAbortRef.current = ctrl;

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
		someOtherSong(newIndex);
	}, [someOtherSong]);

	const handleStart = () => {
		//just for react-player
		setIsFullscreenable(true);
		void syncIsMuted();
	};

	const handleBandcampReady = () => {
		setIsFullscreenable(false);
		void syncIsMuted();
	};

	// useEffect(() => {
	// 	if (!hasWindow) return;
	// 	const mutedForSync = isMuted;
	// 	if (mutedForSync !== isMutedRef.current) return;
	// 	void syncIsMuted();
	// }, [hasWindow, isMuted, syncIsMuted]);

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

	const handleSeekChange = (e: React.BaseSyntheticEvent) => {
		setPlayed(Number.parseFloat(e.target.value));
	};

	const handleSeekMouseUp = (e: React.BaseSyntheticEvent) => {
		setSeeking(false);
		seekPlayer(Number.parseFloat(e.target.value));
	};

	const handleProgress = (progress: ProgressState) => {
		if (!seeking) {
			setPlayed(progress.played);
		}
	};

	const handleDuration = (duration: number) => setDuration(duration);

	const handleClickFullscreen = async () => {
		const playerElement = hasWindow
			? document.querySelector(".react-player")
			: null;
		if (playerElement) {
			toast.message(
				<div className="font-bold text-2xl text-ring">
					To leave fullscreen, press <span className="italic">Esc</span> on
					keyboard.
				</div>,
				{
					duration: 1500,
				},
			);
			await new Promise(timeout1500);
			screenfull.request(playerElement);
		}
	};

	//Returns correct URL of the track to be played now (according to currentSongIndex)
	const getCurrentUrl = () => {
		return getUrl(currentSongIndex);
	};

	const getUrl = (index: number) => {
		let result = "";
		if (playlist.length > index) {
			result = getMusicServiceAndUrl(playlist[index].eId);
		}
		return result;
	};

	return (
		<footer className="w-full h-21 left-0 bottom-0 fixed bg-card shadow-3xl shadow-primary">
			<div className="flex w-full items-center flex-col grow p-0 m-0">
				<input
					className="w-full -my-2"
					type="range"
					min={0}
					max={0.999999}
					step="any"
					value={played}
					onMouseDown={handleSeekMouseDown}
					onChange={handleSeekChange}
					onMouseUp={handleSeekMouseUp}
				/>
				<div className="flex w-full items-center space-x-2 sm:space-x-6 px-1 sm:px-3 py-1">
					<div className="flex items-center space-x-0.5">
						<Button onClick={prevSong} className="player-button" size="icon">
							<TrackPreviousIcon className="size-5" />
						</Button>
						<Button
							onClick={togglePlayPause}
							className="player-button"
							size="icon-lg"
						>
							{isPlaying ? (
								<PauseIcon className="size-6" />
							) : (
								<PlayIcon className="size-6" />
							)}
						</Button>
						<Button onClick={nextSong} className="player-button" size="icon">
							<TrackNextIcon className="size-5" />
						</Button>
					</div>

					<div className="flex items-center space-x-0.5">
						<Button
							onClick={toggleLooped}
							className={cn(
								"hidden sm:flex",
								howLooped === 0 ? "untoggled-button" : "toggled-button",
							)}
							size="icon"
						>
							{howLooped === 1 ? (
								<ListBulletIcon className="size-5" />
							) : howLooped === 2 ? (
								"1"
							) : (
								""
							)}
							<LoopIcon className="size-5" />
						</Button>
						<Button
							onClick={toggleMuted}
							className={isMuted ? "untoggled-button" : "toggled-button"}
							size="icon"
						>
							{isMuted ? (
								<SpeakerOffIcon className="size-5" />
							) : (
								<SpeakerLoudIcon className="size-5" />
							)}
						</Button>

						<Button
							onClick={handleClickFullscreen}
							className={cn(
								"hidden sm:flex",
								isFullscreenable ? "toggled-button" : "untoggled-button",
							)}
							size="icon"
							disabled={!isFullscreenable}
						>
							<EnterFullScreenIcon className="size-5" />
						</Button>
					</div>

					<div className="text-balance flex grow flex-col">
						<div className="flex font-bold text-sm lg:text-base">
							{playlist.length > currentSongIndex ? (
								<Link to={playlistUrl}>{playlist[currentSongIndex].name}</Link>
							) : (
								"..."
							)}
						</div>
						<div className="flex text-xs">
							<Duration seconds={duration * played} />
							<span className="mx-0.5">/</span>
							<Duration seconds={duration} />
						</div>
					</div>

					{hasWindow &&
						(isBandcampUrl(getCurrentUrl()) ? (
							<BandcampPlayer
								ref={bandcampPlayerRef}
								url={getCurrentUrl()}
								playing={isPlaying}
								volume={1}
								muted={isMuted}
								loop={howLooped === 2}
								onReady={handleBandcampReady}
								onPlay={handlePlay}
								onPause={handlePause}
								onEnded={handleEnded}
								onProgress={handleProgress}
								onDuration={handleDuration}
								onError={handleError}
							/>
						) : isDailymotionUrl(getCurrentUrl()) ? (
							<DailymotionSkipper
								onSkip={handleError}
								trackToken={currentSongIndex}
							/>
						) : (
							<ReactPlayer
								ref={playerRef}
								url={getCurrentUrl()}
								className="react-player"
								height="72px"
								width="72px"
								controls={true}
								playing={isPlaying}
								onStart={handleStart}
								onPlay={handlePlay}
								onPause={handlePause}
								onEnded={handleEnded}
								volume={1}
								muted={isMuted}
								loop={howLooped === 2}
								onError={handleError}
								onProgress={handleProgress}
								onDuration={handleDuration}
								style={{ marginTop: "1px" }}
							/>
						))}
				</div>
			</div>
		</footer>
	);
}

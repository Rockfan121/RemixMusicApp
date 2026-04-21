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
import { timeout200, timeout1000, timeout1500 } from "@/helpers/timeouts";
import { cn } from "@/lib/styles";
import type { Track } from "@/types/openwhyd-types";
import type { ProgressState } from "@/types/progress-state-type";
import DailymotionSkipper from "./DailymotionSkipper";
import { Duration } from "./duration";

interface MusicPlayerProps {
	playlist: Array<Track>;
	firstTrackNo: number;
	timestamp: number;
	playlistUrl: string;
}
/**
 * Component wrapping ReactPlayer, playing music from some playlist
 */
export function MusicPlayer({
	playlist,
	firstTrackNo,
	timestamp,
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
	const isMutedRef = useRef(isMuted);
	isMutedRef.current = isMuted;

	const isBandcampUrl = (url: string) => url.includes(".bandcamp.com/track/");

	const MATCH_URL_DAILYMOTION =
		/(?:dailymotion\.com(?:\/embed)?\/video|dai\.ly)\/([a-zA-Z0-9]+)/;

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

	async function syncIsMuted() {
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
					await (internalPlayer.setMuted(shouldBeMuted) as Promise<void>);
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
	}

	const startPlayingFromBeginning = useCallback(() => {
		setPlayed(0);
		setIsPlaying(true);
		seekPlayer(0);
	}, [seekPlayer]);

	useEffect(() => {
		if (typeof document !== "undefined") {
			setHasWindow(true);
			setCurrentSongIndex(firstTrackNo);
			console.log(timestamp);
			if (playlist.length > 0) startPlayingFromBeginning();
		}
	}, [firstTrackNo, timestamp, startPlayingFromBeginning, playlist]);

	const togglePlayPause = () => {
		setIsPlaying(!isPlaying);
	};

	const toggleLooped = () => {
		setHowLooped((howLooped + 1) % 3);
	};
	const toggleMuted = () => {
		setIsMuted(!isMuted);
	};

	const changeSong = async (getNextIndex: (prevIndex: number) => number) => {
		await new Promise(timeout200);
		setCurrentSongIndex((prevIndex) => getNextIndex(prevIndex));
		startPlayingFromBeginning();
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
		const currentTrack = playlist[currentSongIndex];
		toast.error(`Track "${currentTrack?.name ?? "Unknown"}" can't be played`, {
			duration: 4000,
		});
		await new Promise(timeout1000);

		const errantUrl = getCurrentUrl();
		let newIndex = currentSongIndex;
		let newUrl = getUrl(newIndex);

		while (errantUrl === newUrl) {
			newIndex = newIndex + 1 < playlist.length ? newIndex + 1 : 0;
			newUrl = getUrl(newIndex);
		}
		someOtherSong(newIndex);
	};

	const handleStart = () => {
		//just for react-player
		console.log("onStart");
		startPlayingFromBeginning();
		setIsFullscreenable(true);
		syncIsMuted();
	};

	const handleBandcampReady = () => {
		setIsFullscreenable(false);
		console.log("onReady");
		syncIsMuted();
	};

	const handlePlay = async () => {
		console.log("onPlay");
		setIsPlaying(true);
	};

	const handlePause = () => {
		console.log("onPause");
		setIsPlaying(false);
	};

	const handleEnded = async () => {
		console.log("onEnded");
		if (currentSongIndex + 1 < playlist.length || howLooped > 0) nextSong();
		else handlePause();
	};

	const handleSeekMouseDown = () => {
		setSeeking(true);
	};

	const handleSeekChange = (e: any) => {
		setPlayed(Number.parseFloat(e.target.value));
	};

	const handleSeekMouseUp = (e: any) => {
		setSeeking(false);
		seekPlayer(Number.parseFloat(e.target.value));
	};

	const handleProgress = (progress: ProgressState) => {
		if (!seeking) {
			setPlayed(progress.played);
		}
	};

	const handleDuration = (duration: number) => {
		setDuration(duration);
	};

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
						{hasWindow && playlist.length > currentSongIndex ? (
							<Link to={playlistUrl}>{playlist[currentSongIndex].name}</Link>
						) : (
							"No song"
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
						<DailymotionSkipper onSkip={handleError} />
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
							onReady={() => console.log("onReady")}
							onDuration={handleDuration}
							style={{ marginTop: "1px" }}
						/>
					))}
			</div>
		</div>
	);
}

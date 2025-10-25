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
import { Button } from "@/components/ui/button";
import { getMusicServiceAndUrl } from "@/helpers/media-url";
import { timeout200, timeout1000 } from "@/helpers/timeouts";
import type { Track } from "@/types/openwhyd-types";
import type { ProgressState } from "@/types/progress-state-type";
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
	const [isLooped, setIsLooped] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [played, setPlayed] = useState(0);
	const [duration, setDuration] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [hasWindow, setHasWindow] = useState(false); //to make sure it's the client side

	const playerRef = useRef<ReactPlayer | null>(null);
	const startPlayingFromBeginning = useCallback(() => {
		setPlayed(0);
		setIsPlaying(true);
		if (playerRef.current !== null) {
			playerRef.current.seekTo(0);
		}
	}, []);

	useEffect(() => {
		if (typeof document !== "undefined") {
			setHasWindow(true);
			setCurrentSongIndex(firstTrackNo);
			//console.log("MusicPlayer timestamp:");
			console.log(timestamp);
			if (playlist.length > 0) startPlayingFromBeginning();
		}
	}, [firstTrackNo, timestamp, startPlayingFromBeginning, playlist]);

	const togglePlayPause = () => {
		setIsPlaying(!isPlaying);
	};

	const toggleLooped = () => {
		setIsLooped(!isLooped);
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
		toast.error(`Track "${playlist[currentSongIndex].name}" can't be played`, {
			duration: 5000,
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
		console.log("onStart");
		startPlayingFromBeginning();
	};

	const handlePlay = () => {
		console.log("onPlay");
		setIsPlaying(true);
	};

	const handlePause = () => {
		console.log("onPause");
		setIsPlaying(false);
	};

	const handleEnded = async () => {
		console.log("onEnded");
		nextSong();
	};

	const handleSeekMouseDown = () => {
		setSeeking(true);
	};

	const handleSeekChange = (e: any) => {
		setPlayed(Number.parseFloat(e.target.value));
	};

	const handleSeekMouseUp = (e: any) => {
		setSeeking(false);
		if (playerRef.current !== null) {
			playerRef.current.seekTo(Number.parseFloat(e.target.value));
		}
	};

	const handleProgress = (progress: ProgressState) => {
		if (!seeking) {
			setPlayed(progress.played);
		}
	};

	const handleDuration = (duration: number) => {
		setDuration(duration);
	};

	const handleClickFullscreen = () => {
		const playerElement = hasWindow
			? document.querySelector(".react-player")
			: null;
		if (playerElement) {
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
			<div className="flex w-full items-center space-x-3 sm:space-x-5 px-1 sm:px-3 py-1">
				<div className="flex items-center space-x-0 sm:space-x-0.5">
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
						className={isLooped ? "toggled-button" : "untoggled-button"}
						size="icon"
					>
						{isLooped ? "1" : <ListBulletIcon className="size-5" />}
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
						className="toggled-button"
						size="icon"
					>
						<EnterFullScreenIcon className="size-5" />
					</Button>
				</div>

				<div className="truncate flex grow flex-col">
					<h4 className="flex font-bold">
						{hasWindow && playlist.length > currentSongIndex ? (
							<Link to={playlistUrl}>{playlist[currentSongIndex].name}</Link>
						) : (
							"No song"
						)}
					</h4>
					<div className="flex text-xs">
						<Duration seconds={duration * played} />
						<span className="mx-0.5">/</span>
						<Duration seconds={duration} />
					</div>
				</div>

				{hasWindow && (
					<ReactPlayer
						ref={playerRef}
						url={getCurrentUrl()}
						className="react-player"
						height="74px"
						width="74px"
						controls={true}
						playing={isPlaying}
						onStart={handleStart}
						onPlay={handlePlay}
						onPause={handlePause}
						onEnded={handleEnded}
						volume={1}
						muted={isMuted}
						loop={isLooped}
						onError={handleError}
						onProgress={handleProgress}
						onReady={() => console.log("onReady")}
						onDuration={handleDuration}
						style={{ marginTop: "5px" }}
					/>
				)}
			</div>
		</div>
	);
}

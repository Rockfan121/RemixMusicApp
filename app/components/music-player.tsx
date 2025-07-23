import {
	ListBulletIcon,
	LoopIcon,
	PauseIcon,
	PlayIcon,
	SpeakerLoudIcon,
	SpeakerOffIcon,
	TrackNextIcon,
	TrackPreviousIcon,
} from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMusicServiceAndUrl } from "@/helpers/media-url";
import { timeout200, timeout400 } from "@/helpers/timeouts";
import type { Track } from "@/types/openwhyd-types";
import type { ProgressState } from "@/types/progress-state-type";

/**
 * Component wrapping ReactPlayer, playing music from some playlist
 * @param children - tracks from the playlist
 * @param firstTrack - index of the track to be played first
 */
export function MusicPlayer({
	children,
	firstTrack,
}: {
	children: Array<Track>;
	firstTrack: number;
}) {
	const [currentSongIndex, setCurrentSongIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(true);
	const [isLooped, setIsLooped] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [played, setPlayed] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [hasWindow, setHasWindow] = useState(false); //to make sure it's the client side

	const playerRef = useRef<ReactPlayer | null>(null);

	useEffect(() => {
		if (typeof document !== "undefined") {
			setHasWindow(true);
			setCurrentSongIndex(firstTrack);
		}
	}, [firstTrack]);

	const togglePlayPause = () => {
		setIsPlaying(!isPlaying);
	};

	const toggleLooped = () => {
		setIsLooped(!isLooped);
	};
	const toggleMuted = () => {
		setIsMuted(!isMuted);
	};

	const nextSong = async () => {
		await new Promise(timeout200);
		setCurrentSongIndex((prevIndex: number) =>
			prevIndex + 1 < children.length ? prevIndex + 1 : 0,
		);
	};

	const nextSongAfterError = async () => {
		toast.error(
			`Track \"${children[currentSongIndex].name}\" can't be played`,
			{
				duration: 7000,
			},
		);
		await new Promise(timeout400);
		nextSong();
	};

	const prevSong = async () => {
		await new Promise(timeout200);
		setCurrentSongIndex((prevIndex) =>
			prevIndex - 1 >= 0 ? prevIndex - 1 : children.length - 1,
		);
	};

	const handleStart = () => {
		setPlayed(0);
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

	//Returns correct URL of the track to be played now (according to currentSongIndex)
	const getUrl = () => {
		let result = "";
		if (children.length > 0) {
			result = getMusicServiceAndUrl(children[currentSongIndex].eId);
		}
		return result;
	};

	return (
		<div className="flex w-full items-center space-x-5 px-4 py-1">
			<div className="flex items-center space-x-1">
				<Button onClick={togglePlayPause} className="rounded-full" size="icon">
					{isPlaying ? <PauseIcon /> : <PlayIcon />}
				</Button>
				<Button onClick={prevSong} className="rounded-full" size="icon">
					<TrackPreviousIcon />
				</Button>
				<Button onClick={nextSong} className="rounded-full" size="icon">
					<TrackNextIcon />
				</Button>
			</div>

			<div className="flex items-center space-x-1">
				<Button
					onClick={toggleLooped}
					className={isLooped ? "toggled-button" : "untoggled-button"}
					size="icon"
				>
					{isLooped ? "1" : <ListBulletIcon />}
					<LoopIcon />
				</Button>
				<Button
					onClick={toggleMuted}
					className={isMuted ? "untoggled-button" : "toggled-button"}
					size="icon"
				>
					{isMuted ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
				</Button>
			</div>

			<div className="flex items-center flex-col grow space-y-2">
				<h4 className="font-bold px-4 truncate">
					{children.length > 0 ? children[currentSongIndex].name : "No song"}
				</h4>
				<input
					className="w-full"
					type="range"
					min={0}
					max={0.999999}
					step="any"
					value={played}
					onMouseDown={handleSeekMouseDown}
					onChange={handleSeekChange}
					onMouseUp={handleSeekMouseUp}
				/>
			</div>

			{hasWindow && (
				<ReactPlayer
					ref={playerRef}
					url={getUrl()}
					height="80px"
					width="80px"
					playing={isPlaying}
					onEnded={nextSong}
					volume={1}
					muted={isMuted}
					loop={isLooped}
					onStart={handleStart}
					onError={nextSongAfterError}
					onProgress={handleProgress}
				/>
			)}
			{/* </div> */}
		</div>
	);
}

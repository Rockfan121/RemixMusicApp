import { Button } from "@/components/ui/button";
import type { QueuedTrack } from "@/types/openwhydObjects";
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
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

export function MusicPlayer({
	children,
}: {
	children: Array<QueuedTrack>;
}) {
	const [currentSongIndex, setCurrentSongIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(true);
	const [isLooped, setIsLooped] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [hasWindow, setHasWindow] = useState(false); //to make sure it's the client side

	useEffect(() => {
		if (typeof document !== "undefined") {
			setHasWindow(true);
		}
	}, []);

	const togglePlayPause = () => {
		setIsPlaying(!isPlaying);
	};

	const toggleLooped = () => {
		setIsLooped(!isLooped);
	};
	const toggleMuted = () => {
		setIsMuted(!isMuted);
	};

	const nextSong = () => {
		setCurrentSongIndex((prevIndex: number) =>
			prevIndex + 1 < children.length ? prevIndex + 1 : 0,
		);
	};

	// const nextSongAfterError = () => {
	// 	console.log("REACT PLAYER ERROR!");
	// 	setCurrentSongIndex((prevIndex) =>
	// 		prevIndex + 1 < playlist.length ? prevIndex + 1 : 0
	// 	);
	// };

	const prevSong = () => {
		setCurrentSongIndex((prevIndex) =>
			prevIndex - 1 >= 0 ? prevIndex - 1 : children.length - 1,
		);
	};

	return (
		<div className="flex w-full items-center justify-between px-4 py-1">
			<div className="flex items-center space-x-4">
				<div className="flex items-center space-x-1">
					<Button
						onClick={togglePlayPause}
						className="rounded-full"
						size="icon"
					>
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
			</div>
			<h4 className="font-bold px-4 truncate">
				{children[currentSongIndex].title}
			</h4>
			{hasWindow && (
				<ReactPlayer
					url={children[currentSongIndex].url}
					height="120px"
					width="700px"
					playing={isPlaying}
					controls={true}
					onEnded={nextSong}
					volume={1}
					muted={isMuted}
					loop={isLooped}
				/>
			)}
		</div>
	);
}

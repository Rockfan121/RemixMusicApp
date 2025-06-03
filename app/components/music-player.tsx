import { Button } from "@/components/ui/button";
import type { Track } from "@/types/openwhydObjects";
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
import { toast } from "sonner";

export const getYTUrl = (eId: string) => {
	let result = eId.substring(4);
	result = `https://www.youtube.com/watch?v=${result}`;
	return result;
};

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
	const [hasWindow, setHasWindow] = useState(false); //to make sure it's the client side

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
		await new Promise((r) => setTimeout(r, 200));
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
		await new Promise((r) => setTimeout(r, 400));
		nextSong();
	};

	const prevSong = async () => {
		await new Promise((r) => setTimeout(r, 200));
		setCurrentSongIndex((prevIndex) =>
			prevIndex - 1 >= 0 ? prevIndex - 1 : children.length - 1,
		);
	};

	/**
	 * Returns correct URL of the track to be played now (according to currentSongIndex)
	 * @returns URL to the appropriate video/audio
	 */
	const getUrl = () => {
		let result = "";
		if (children.length > 0) {
			result = getYTUrl(children[currentSongIndex].eId);
		}
		return result;
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
				{children.length > 0 ? children[currentSongIndex].name : "No song"}
			</h4>
			{hasWindow && (
				<ReactPlayer
					url={getUrl()}
					height="120px"
					width="700px"
					playing={isPlaying}
					controls={true}
					onEnded={nextSong}
					volume={1}
					muted={isMuted}
					loop={isLooped}
					onError={nextSongAfterError}
				/>
			)}
		</div>
	);
}

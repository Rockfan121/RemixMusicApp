import {
	EnterFullScreenIcon,
	ExitFullScreenIcon,
	ListBulletIcon,
	LoopIcon,
	PauseIcon,
	PlayIcon,
	SpeakerLoudIcon,
	SpeakerOffIcon,
	TrackNextIcon,
	TrackPreviousIcon,
} from "@radix-ui/react-icons";
import _ReactPlayer from "react-player";
import { Link } from "react-router";

// Vite 8 CJS/ESM interop: react-player's CJS bundle sets __esModule:true and
// nests the class under .default, so the raw module object may land here
// instead of the class itself. Unwrap if needed.
const ReactPlayer =
	(_ReactPlayer as unknown as { default: typeof _ReactPlayer }).default ??
	_ReactPlayer;

import { BandcampPlayer } from "@/components/BandcampPlayer";
import { Button } from "@/components/ui/button";
import { isBandcampUrl, isDailymotionUrl } from "@/helpers/media-url";
import { cn } from "@/lib/styles";
import DailymotionSkipper from "./DailymotionSkipper";
import { Duration } from "./duration";
import type { MusicPlayerProps } from "./use-music-player";
import { useMusicPlayer } from "./use-music-player";

interface Props extends MusicPlayerProps {
	playlistUrl: string;
}
/**
 * Component wrapping ReactPlayer, playing music from some playlist
 */

export function MusicPlayer({
	playlist,
	firstTrackNo,
	playRequestId,
	playlistUrl,
}: Props) {
	const {
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
	} = useMusicPlayer({
		firstTrackNo,
		playRequestId,
		playlist,
	});

	return (
		<>
			<footer className="w-full h-21 left-0 bottom-0 fixed bg-card shadow-3xl shadow-primary z-10000">
				<div className="flex w-full h-full items-center flex-col grow p-0 m-0">
					<input
						className="w-full -my-2"
						type="range"
						min={0}
						max={0.999999}
						step="any"
						value={played}
						onPointerDown={handleSeekMouseDown}
						onChange={handleSeekChange}
						onPointerUp={handleSeekMouseUp}
						disabled={!playlist || playlist.length === 0}
					/>
					<div className="flex video-controls mr-18 h-full items-center place-items-start space-x-2 sm:space-x-6 px-1 sm:px-3 py-1">
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
								) : null}
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
								onClick={toggleBrowserFullscreen}
								className={cn("hidden sm:flex", "toggled-button")}
								size="icon"
							>
								{isBrowserFullscreen ? (
									<ExitFullScreenIcon className="size-5" />
								) : (
									<EnterFullScreenIcon className="size-5" />
								)}
							</Button>
						</div>

						<div className="text-balance flex grow flex-col">
							<div className="flex font-bold text-sm lg:text-base">
								<Link to={playlistUrl ?? ""}>
									{currentTrack?.name ?? "..."}
								</Link>
							</div>
							<div className="flex text-xs">
								<Duration seconds={duration * played} />
								<span className="mx-0.5">/</span>
								<Duration seconds={duration} />
							</div>
						</div>
					</div>
				</div>
			</footer>
			<div
				className={`video-container ${isBrowserFullscreen ? "browser-fullscreen" : ""}`}
			>
				<div className="player-wrapper">
					{hasWindow &&
						(isBandcampUrl(currentUrl) ? (
							<BandcampPlayer
								key={currentSongIndex}
								ref={bandcampPlayerRef}
								url={currentUrl}
								playing={isPlaying}
								volume={1}
								muted={isMuted}
								loop={howLooped === 2}
								onReady={syncIsMuted}
								onPlay={handlePlay}
								onPause={handlePause}
								onEnded={handleEnded}
								onProgress={handleProgress}
								onDuration={handleDuration}
								onError={handleError}
							/>
						) : isDailymotionUrl(currentUrl) ? (
							<DailymotionSkipper
								onSkip={handleError}
								trackToken={currentSongIndex}
							/>
						) : (
							<ReactPlayer
								key={currentSongIndex}
								ref={playerRef}
								url={currentUrl}
								className="react-player"
								height="100%"
								width="100%"
								controls={true}
								playing={isPlaying}
								onStart={syncIsMuted}
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
		</>
	);
}

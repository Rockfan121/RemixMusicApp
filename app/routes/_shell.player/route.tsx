import { MusicPlayer } from "@/components/music-player";
import type { ContextType } from "@/types/myObjects";
import type { Track } from "@/types/openwhydObjects";
import { useState } from "react";
import { Outlet, useNavigation } from "react-router";

/**
 * This route displays MusicPlayer (and passes data to it), sets the callback function (used e.g. in "tracks" route)
 * and dims the main content if it isn't loaded yet.
 */
export default function Player() {
	const navigation = useNavigation();

	const [playlist, setPlaylist] = useState<Array<Track>>([]);
	const [firstTrack, setFirstTrack] = useState<number>(0);

	const handleCallback = (a: Array<Track>, b: number) => {
		setPlaylist(a);
		setFirstTrack(b);
	};

	const contextValue: ContextType = {
		callback: handleCallback,
	};

	return (
		<>
			<div
				className={
					navigation.state === "loading" ? "pb-28 content-loading" : "pb-28"
				}
			>
				<Outlet context={contextValue} />
			</div>
			<footer className="w-full h-32 left-0 bottom-0 fixed bg-accent">
				<MusicPlayer firstTrack={firstTrack}>{playlist}</MusicPlayer>
			</footer>
		</>
	);
}

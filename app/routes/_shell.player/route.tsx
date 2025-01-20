import { MusicPlayer } from "@/components/music-player";
import type { Track } from "@/types/openwhydObjects";
import { Outlet } from "@remix-run/react";
import { useState } from "react";

interface ContextType {
	callback: (a: Array<Track>, b: number) => void;
}

export default function Player() {
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
			<div className="pb-28">
				<Outlet context={contextValue} />
			</div>
			<footer className="w-full h-32 left-0 bottom-0 fixed bg-accent">
				<MusicPlayer firstTrack={firstTrack}>{playlist}</MusicPlayer>
			</footer>
		</>
	);
}

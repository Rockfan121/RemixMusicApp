import { MusicPlayer } from "@/components/music-player";
import { EXAMPLE_PLAYLIST } from "@/types/openwhydObjects";
import { Outlet } from "@remix-run/react";
import { useState } from "react";

export default function Player() {
	const [playlist] = useState(EXAMPLE_PLAYLIST);

	return (
		<>
			<div className="pb-28">
				<Outlet />
			</div>
			<footer className="w-full h-32 left-0 bottom-0 fixed bg-accent">
				<MusicPlayer>{playlist}</MusicPlayer>
			</footer>
		</>
	);
}

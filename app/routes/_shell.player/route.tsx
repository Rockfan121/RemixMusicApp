import { MusicPlayer } from "@/components/music-player";
import { Outlet } from "@remix-run/react";

export default function Player() {
	return (
		<>
			<div className="pb-28">
				<Outlet />
			</div>
			<footer className="w-full h-32 left-0 bottom-0 fixed bg-accent">
				<MusicPlayer />
			</footer>
		</>
	);
}

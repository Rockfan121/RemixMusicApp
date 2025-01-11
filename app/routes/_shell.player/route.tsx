import { MusicPlayer } from "@/components/music-player";
import { Outlet } from "@remix-run/react";
import { useState } from "react";

export type QueuedTrack = {
	title: string;
	url: string;
};

export default function Player() {
	const [playlist] = useState([
		{
			url: "https://www.youtube.com/watch?v=dVG_fFXrD1M",
			title:
				"Never Back Down [ft. @Manafest] - Caleb Hyles (Official Music Video)",
		},
		{
			url: "https://www.youtube.com/watch?v=fJ7ec5v6aSg",
			title:
				"UNPARALYZED [ft. Trevor McNevan of Thousand Foot Krutch] - Caleb Hyles (Official Music Video)",
		},
		{
			url: "https://www.youtube.com/watch?v=7gm6Id6a9KA",
			title: "JUST ONE STEP - Caleb Hyles & @jonathanymusic (Original Song)",
		},
		{
			url: "https://www.youtube.com/watch?v=PtMcyZz9X7E",
			title:
				"Darkness Before The Dawn - Caleb Hyles (feat. @OfficialLaceySturm)",
		},
		{
			url: "https://www.youtube.com/watch?v=CahV0rr7MBE",
			title: "IDOLIZE - Caleb Hyles (Original Song)",
		},
	]);

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

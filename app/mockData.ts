import type { Playlist } from "./components/playlists";

export const PLAYLISTS: Array<Playlist> = Array.from({ length: 20 }).map(
	(_, i, a) => ({
		no: `${i}`,
		title: `Playlist no ${i + 1}`,
		author: "Author",
		cover:
			"https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80",
		link: "/tracks",
	}),
);

export const TRACKS_COVER =
	"https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80";

export const TRACKS = [
	{
		no: "001",
		cover: TRACKS_COVER,
		title: "All Good Things - Fight",
		length: "2:00",
		link: "/",
	},
	{
		no: "002",
		cover: TRACKS_COVER,
		title: "All Good Things - Get Up",
		length: "3:00",
		link: "/",
	},
	{
		no: "003",
		cover: TRACKS_COVER,
		title: "Camel - Pressure Points",
		length: "1:10",
		link: "/",
	},
	{
		no: "004",
		cover: TRACKS_COVER,
		title: "IDOLIZE - Caleb Hyles",
		length: "2:00",
		link: "/",
	},
	{
		no: "005",
		cover: TRACKS_COVER,
		title: "JUST ONE STEP - Caleb Hyles",
		length: "3:00",
		link: "/",
	},
	{
		no: "006",
		cover: TRACKS_COVER,
		title: "Never Back Down [ft. @Manafest] - Caleb Hyles",
		length: "2:00",
		link: "/",
	},
	{
		no: "007",
		cover: TRACKS_COVER,
		title: 'Skillet - "Feel Invincible" [Official Music Video]',
		length: "4:00",
		link: "/",
	},
	{
		no: "008",
		cover: TRACKS_COVER,
		title: "Darkness Before The Dawn - Caleb Hyles",
		length: "5:00",
		link: "/",
	},
	{
		no: "009",
		cover: TRACKS_COVER,
		title: "Courtesy Call - Thousand Foot Krutch",
		length: "5:00",
		link: "/",
	},
	{
		no: "010",
		cover: TRACKS_COVER,
		title: "Official War of Change Music Video by Thousand Foot Krutch",
		length: "4:40",
		link: "/",
	},
	{
		no: "011",
		cover: TRACKS_COVER,
		title: "LEDGER: Completely [Official Video]",
		length: "2:00",
		link: "/",
	},
	{
		no: "012",
		cover: TRACKS_COVER,
		title: "UNPARALYZED [ft. Trevor McNevan]",
		length: "2:00",
		link: "/",
	},
	{
		no: "013",
		cover: TRACKS_COVER,
		title: "Skillet -“Stars” (The Shack Version)",
		length: "2:00",
		link: "/",
	},
];

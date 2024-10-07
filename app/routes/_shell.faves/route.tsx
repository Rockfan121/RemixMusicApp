import PlaylistsList from "@/components/playlists";
import { PLAYLISTS } from "@/mockData";

export default function Faves() {
	return (
		<PlaylistsList listIntro="Your favorites" hasUserSearch={false}>
			{PLAYLISTS}
		</PlaylistsList>
	);
}

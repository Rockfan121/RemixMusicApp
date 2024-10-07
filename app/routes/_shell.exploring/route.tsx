import PlaylistsList from "@/components/playlists";
import { PLAYLISTS } from "@/mockData";

export default function Exploring() {
	return (
		<PlaylistsList listIntro="Explore playlists" hasUserSearch={true}>
			{PLAYLISTS}
		</PlaylistsList>
	);
}

import PlaylistsList from "@/components/playlists";
import { PLAYLISTS } from "@/mockData";

export default function Recent() {
	return (
		<PlaylistsList listIntro="Your recently played" hasUserSearch={false}>
			{PLAYLISTS}
		</PlaylistsList>
	);
}

import PlaylistsList from "@/components/playlists";

export default function Recent() {
	return (
		<PlaylistsList
			listIntro="Your recently played"
			listEmptyText="You have no recently played playlists yet. Play something from 'Playlists' tab, then it will be displayed here!"
		/>
	);
}

import PlaylistsList from "@/components/playlists";

export default function Faves() {
	return (
		<PlaylistsList
			listIntro="Your favorites"
			listEmptyText="You have no favorite playlists yet. Choose something from 'Playlists' tab and give it a star, then it will be displayed here!"
		/>
	);
}

import type { MetaFunction } from "react-router";
import PlaylistsList from "@/components/playlists";
import { title } from "@/config.shared";

const PAGE_TITLE = "Your favorites";

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function Faves() {
	return (
		<PlaylistsList
			listIntro={PAGE_TITLE}
			listEmptyText="You have no favorite playlists yet. Choose something from 'Playlists' tab and give it a star, then it will be displayed here!"
		/>
	);
}

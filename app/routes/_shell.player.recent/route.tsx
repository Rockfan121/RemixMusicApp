import type { MetaFunction } from "react-router";
import PlaylistsList from "@/components/playlists";
import { title } from "@/config.shared";

const PAGE_TITLE = "Your recently played";

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function Recent() {
	return (
		<PlaylistsList
			listIntro={PAGE_TITLE}
			listEmptyText="You have no recently played playlists yet. Play something from 'Playlists' tab, then it will be displayed here!"
		/>
	);
}

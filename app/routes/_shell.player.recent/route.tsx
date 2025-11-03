import { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import PlaylistsList from "@/components/playlists";
import { title } from "@/config.shared";
import { getRecentPlaylists } from "@/helpers/recent-playlists";
import type { XPlaylist } from "@/types/xplaylist-type";

const PAGE_TITLE = "Your recently played";

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function Recent() {
	const [recentPl, setRecentPl] = useState<XPlaylist[]>([]);
	useEffect(() => {
		const recentPl = getRecentPlaylists();
		setRecentPl(recentPl);
	}, []);
	return (
		<PlaylistsList
			listIntro={PAGE_TITLE}
			listEmptyText="You have no recently played playlists yet. Play something from 'Playlists' tab, then it will be displayed here!"
		>
			{recentPl}
		</PlaylistsList>
	);
}

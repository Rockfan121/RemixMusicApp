import { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import PlaylistsList from "@/components/playlists";
import { title } from "@/config.shared";
import { getFavoritePlaylists } from "@/helpers/favorite-playlists";
import type { XPlaylist } from "@/types/xplaylist-type";

const PAGE_TITLE = "Your favorites";

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function Faves() {
	const [favesPl, setFavesPl] = useState<XPlaylist[]>([]);
	useEffect(() => {
		const favesPl = getFavoritePlaylists();
		setFavesPl(favesPl);
	}, []);

	return (
		<PlaylistsList
			listIntro={PAGE_TITLE}
			listEmptyText="You have no favorite playlists yet. Choose something from 'Playlists' tab and give it a star, then it will be displayed here!"
		>
			{favesPl}
		</PlaylistsList>
	);
}

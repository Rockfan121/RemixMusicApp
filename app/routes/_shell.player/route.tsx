import { MusicPlayer } from "@/components/music-player";
import { PlaylistScrollArea } from "@/components/playlist-scroll-area";
import type { ContextType, XPlaylist } from "@/types/myObjects";
import type { Track } from "@/types/openwhydObjects";
import { getFavoritePlaylists, toggleFavorite } from "@/utils/favesPlaylists";
import {
	addToRecentPlaylists,
	getRecentPlaylists,
} from "@/utils/recentPlaylists";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useEffect, useState } from "react";
import { Outlet, useNavigation } from "react-router";

/**
 * This route displays MusicPlayer (and passes data to it), sets the callback function (used e.g. in "tracks" route)
 * and dims the main content if it isn't loaded yet.
 */
export default function Player() {
	const navigation = useNavigation();

	const [playlist, setPlaylist] = useState<Array<Track>>([]);
	const [firstTrack, setFirstTrack] = useState<number>(0);
	const [recentPl, setRecentPl] = useState<XPlaylist[]>([]);
	const [favesPl, setFavesPl] = useState<XPlaylist[]>([]);

	useEffect(() => {
		const recentPl = getRecentPlaylists();
		setRecentPl(recentPl);

		const favesPl = getFavoritePlaylists();
		setFavesPl(favesPl);
	}, []);

	const handleCallback = (a: Array<Track>, b: number, c: XPlaylist) => {
		setPlaylist(a);
		setFirstTrack(b);

		addToRecentPlaylists(c);
		setRecentPl(getRecentPlaylists());
	};

	const handleFavesCallback = (a: XPlaylist) => {
		toggleFavorite(a);
		setFavesPl(getFavoritePlaylists());
	};

	const contextValue: ContextType = {
		callback: handleCallback,
		favesCallback: handleFavesCallback,
	};

	return (
		<>
			<aside className="h-full w-80 fixed top-0 left-0 pt-14 pb-32 px-3 overflow-x-hidden hidden md:block">
				<PlaylistScrollArea title="Recently played" link="/player/recent">
					{recentPl}
				</PlaylistScrollArea>
				<Separator className="my-1.5" />

				<PlaylistScrollArea title="Favorites" link="/player/faves">
					{favesPl}
				</PlaylistScrollArea>
			</aside>

			<div
				className={
					navigation.state === "loading"
						? "main-content content-loading"
						: "main-content"
				}
			>
				<Outlet context={contextValue} />
			</div>

			<footer className="w-full h-32 left-0 bottom-0 fixed bg-accent">
				<MusicPlayer firstTrack={firstTrack}>{playlist}</MusicPlayer>
			</footer>
		</>
	);
}

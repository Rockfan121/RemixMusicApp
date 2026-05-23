import { Link, Outlet, useNavigation } from "react-router";
import { PlaylistScrollArea } from "@/components/playlist-scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePlayerContext } from "@/types/player-context";
import {
	HOT_TRACKS_LINK,
	PlaylistsNames,
	RECENT_TRACKS_LINK,
} from "@/types/playlists-types";

/**
 * This layout route displays side menu and dims the main content if it isn't loaded yet.
 */
export default function Player() {
	const navigation = useNavigation();
	const { recentPl } = usePlayerContext();

	return (
		<>
			<aside className="h-full w-80 fixed top-0 left-0 pt-12 pb-28 px-3 overflow-hidden hidden md:block border-r-2 border-secondary">
				<h4 className="m-3 mb-1 text-[17px] font-semibold leading-none text-ring">
					<Link to={RECENT_TRACKS_LINK}>{PlaylistsNames.All}</Link>
				</h4>
				<Separator className="my-2.5" />
				<h4 className="m-3 mb-1 text-[17px] font-semibold leading-none text-ring">
					<Link to={HOT_TRACKS_LINK}>{PlaylistsNames.Hot}</Link>
				</h4>
				<Separator className="my-2.5" />
				<PlaylistScrollArea title="Recently played" link="/recent">
					{recentPl}
				</PlaylistScrollArea>
			</aside>

			<div
				className={
					navigation.state === "loading"
						? "main-content content-loading"
						: "main-content"
				}
			>
				<Outlet />
			</div>
		</>
	);
}

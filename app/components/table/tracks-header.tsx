import {
	ExternalLinkIcon,
	StarFilledIcon,
	StarIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { isPlaylistFavorite } from "@/helpers/favorite-playlists";
import { imgUrl, openwhydUrl } from "@/types/apiplaylist-helpers";
import type { ContextType } from "@/types/context-type";
import type { ApiPlaylist } from "@/types/openwhyd-types";
import { PlaylistsIDs } from "@/types/playlists-types";
import UserLink from "../user-link";

export default function TracksHeader({
	apiplaylistInfo,
}: {
	apiplaylistInfo: ApiPlaylist;
}) {
	const { favesCallback } = useOutletContext<ContextType>();
	const [favorite, setFavorite] = useState(false);

	useEffect(() => {
		const isFavorite = isPlaylistFavorite(`${apiplaylistInfo.id}`);
		setFavorite(isFavorite);
	}, [apiplaylistInfo]);

	/**
	 * Function to both call favesCallback and update local state
	 */
	const fireFavesCallback = (playlist: ApiPlaylist) => {
		favesCallback(playlist);
		setFavorite(!favorite);
	};

	const playlistCover = imgUrl(apiplaylistInfo.id);

	return (
		<div className="mx-6 playlist-container p-6 mb-8 border-2 rounded-md min-h-52 flex bg-card">
			<div className="playlist-background-image playlist-image rounded-xl">
				<img
					src={playlistCover}
					alt="Playlist cover"
					aria-hidden
					className="playlist-image rounded-md"
				/>
			</div>
			<div className="flex flex-col">
				<h1 className="ml-6 mb-1 text-2xl font-bold leading-none text-ring">
					{`${apiplaylistInfo.name}`}
				</h1>

				<h2 className="mx-6 mt-4 mb-8 flex">
					{apiplaylistInfo.uId !== "" ? (
						<UserLink
							id={apiplaylistInfo.uId}
							name={apiplaylistInfo.uNm}
							withImg={true}
							isLarge={true}
						/>
					) : (
						""
					)}
				</h2>
				<div className="grow" />
				<div className="flex space-x-1 mb-4">
					<button
						type="button"
						onClick={() => fireFavesCallback(apiplaylistInfo)}
						aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
						name="favorite"
						value={favorite ? "false" : "true"}
					>
						{favorite ? (
							<StarFilledIcon className="ml-6 h-6 w-6 inline" />
						) : (
							<StarIcon className="ml-6 h-6 w-6 inline" />
						)}
					</button>

					{apiplaylistInfo.id !== PlaylistsIDs.UserStream ? (
						<a
							href={openwhydUrl(apiplaylistInfo)}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLinkIcon className="ml-4 h-6 w-6 inline" />
						</a>
					) : (
						""
					)}
				</div>
			</div>
		</div>
	);
}

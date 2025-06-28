import {
	ExternalLinkIcon,
	StarFilledIcon,
	StarIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { isPlaylistFavorite } from "@/helpers/favorite-playlists";
import type { ContextType } from "@/types/context-type";
import { imgUrl, openwhydUrl } from "@/types/xplaylist-helpers";
import type { XPlaylist } from "@/types/xplaylist-type";

export default function TracksHeader({
	xplaylistInfo,
}: {
	xplaylistInfo: XPlaylist;
}) {
	const { favesCallback } = useOutletContext<ContextType>();
	const [favorite, setFavorite] = useState(false);

	useEffect(() => {
		const isFavorite = isPlaylistFavorite(`${xplaylistInfo.id}`);
		setFavorite(isFavorite);
	}, [xplaylistInfo]);

	/**
	 * Function to both call favesCallback and update local state
	 */
	const fireFavesCallback = (playlist: XPlaylist) => {
		favesCallback(playlist);
		setFavorite(!favorite);
	};

	return (
		<div className="mx-6 playlist-container p-6 mb-8 border-2 rounded-md h-52 flex bg-card">
			<div className="albumCover aspect-square h-40 w-40 rounded-xl object-cover">
				<img
					src={imgUrl(xplaylistInfo)}
					alt="Playlist cover"
					aria-hidden
					className="aspect-square h-40 w-40 rounded-md object-cover"
				/>
			</div>
			<div>
				<h4 className="ml-6 mb-1 text-2xl font-bold leading-none text-ring">
					{`${xplaylistInfo.name}`}
				</h4>
				<h5 className="ml-6 mb-6 text-lg text-muted-foreground">{`${xplaylistInfo.uNm}`}</h5>
				<button
					type="button"
					onClick={() => fireFavesCallback(xplaylistInfo)}
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

				<a
					href={openwhydUrl(xplaylistInfo)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<ExternalLinkIcon className="ml-4 h-6 w-6 inline" />
				</a>
			</div>
		</div>
	);
}

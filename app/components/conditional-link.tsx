import type { Playlist } from "@/types/openwhydObjects";
import type React from "react";
import { Link } from "react-router";
import { toast } from "sonner";

/**
 * Component used in PlaylistsList - it displays playlist cover and some basic information about a given playlist
 * @param userId - the id of the user (owner of the playlist)
 * @param userName - the name of the user (see above)
 * @param playlist - the playlist which information will be displayed
 */
export default function ConditionalLink({
	userId,
	userName,
	playlist,
}: {
	userId: string;
	userName: string;
	playlist: Playlist;
}) {
	let item: React.ReactNode;
	if (playlist.nbTracks === 0) {
		item = (
			<button
				className="h-fit w-fit p-0 text-left"
				type="button"
				onClick={() => toast.warning(`Playlist \"${playlist.name}\" is empty!`)}
			>
				<figure>
					<div className="w-28 h-28 overflow-hidden rounded-md albumCover">
						<img
							src={`https://openwhyd.org${playlist.img}`}
							alt="Playlist cover"
							aria-hidden
							className="aspect-square h-fit w-fit object-cover"
						/>
					</div>
					<figcaption className="pt-1 font-semibold text-sm text-muted-foreground">
						{`${userName}`} <br />
						<span className="text-foreground">{`${playlist.name}`}</span>
					</figcaption>
				</figure>
			</button>
		);
	} else {
		item = (
			<Link
				to={`/player/tracks/${userId}/${playlist.id}`}
				state={{ playlistImg: `https://openwhyd.org${playlist.img}` }}
			>
				<figure>
					<div className="w-28 h-28 overflow-hidden rounded-md albumCover">
						<img
							src={`https://openwhyd.org${playlist.img}`}
							alt="Playlist cover"
							aria-hidden
							className="aspect-square h-fit w-fit object-cover"
						/>
					</div>
					<figcaption className="pt-1 font-semibold text-sm text-muted-foreground">
						{`${userName}`} <br />
						<span className="text-foreground">{`${playlist.name}`}</span>
					</figcaption>
				</figure>
			</Link>
		);
	}

	return <>{item}</>;
}

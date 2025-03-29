import type { Playlist } from "@/types/openwhydObjects";
import type React from "react";
import { Link } from "react-router";
import { toast } from "sonner";

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
					<div className="w-28 h-28 overflow-hidden rounded-md">
						<img
							src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
							alt={`${playlist.name} cover`}
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
					<div className="w-28 h-28 overflow-hidden rounded-md">
						<img
							src={`https://openwhyd.org${playlist.img}`}
							alt={`${playlist.name} cover`}
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

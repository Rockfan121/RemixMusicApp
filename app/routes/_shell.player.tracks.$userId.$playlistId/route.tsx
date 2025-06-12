import { getYTUrl } from "@/components/music-player";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ContextType, XPlaylist } from "@/types/myObjects";
import type { Track } from "@/types/openwhydObjects";
import {
	ExternalLinkIcon,
	PlayIcon,
	StarFilledIcon,
	StarIcon,
} from "@radix-ui/react-icons";
import ScrollToTop from "react-scroll-to-top";

import { isPlaylistFavorite, toggleFavorite } from "@/utils/favesPlaylists";
import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import {
	useLoaderData,
	useLocation,
	useOutletContext,
	useParams,
} from "react-router";

/**
 * Fetch tracks from one of Openwhyd users playlists
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
	const PLAYLIST_URL = `https://openwhyd.org/u/${params.userId}/playlist/${params.playlistId}`;
	await new Promise((r) => setTimeout(r, 300));
	const res = await fetch(`${PLAYLIST_URL}?format=json&limit=200`);
	return await res.json();
};

/**
 * Component for displaying a given playlists.
 * It enables the user to start playing music, starting with the track clicked by the user.
 * The callback passes data to MusicPlayer and starts the player.
 */
export default function TracksList() {
	const params = useParams();
	const TRACKS = useLoaderData<typeof loader>();
	const { callback, favesCallback } = useOutletContext<ContextType>();
	const location = useLocation();
	const [favorite, setFavorite] = useState<boolean>(false);

	//Getting the playlist cover (thanks to useLocation). If it's not possible, the cover of the first track is used.
	let playlistImg = TRACKS[0].img;
	const state = location.state;
	if (location.state !== null) playlistImg = state.playlistImg;

	/**
	 * Structure of the currently displayed playlist (based on TRACKS form useLoaderData and playlistImg from - hopefully - useLocation)
	 */
	const playlistInfo: XPlaylist = {
		uNm: TRACKS[0].uNm,
		uId: TRACKS[0].uId,
		id: TRACKS[0].pl.id,
		name: TRACKS[0].pl.name,
		url: `${TRACKS[0].uId}/${TRACKS[0].pl.id}`,
		nbTracks: TRACKS.length,
		img: playlistImg,
	};

	useEffect(() => {
		const isFavorite = isPlaylistFavorite(
			`${TRACKS[0].uId}/${TRACKS[0].pl.id}`,
		);
		setFavorite(isFavorite);
	}, [TRACKS]);

	/**
	 * Function to both call favesCallback and update local state
	 */
	const fireFavesCallback = (playlist: XPlaylist) => {
		favesCallback(playlist);
		setFavorite(!favorite);
	};

	return (
		<>
			<div className="mx-6 playlist-container p-6 mb-8 border-2 rounded-md h-52 flex bg-card">
				<div className="albumCover aspect-square h-40 w-40 rounded-xl object-cover">
					<img
						src={playlistImg}
						alt="Playlist cover"
						aria-hidden
						className="aspect-square h-40 w-40 rounded-md object-cover"
					/>
				</div>
				<div>
					<h4 className="ml-6 mb-1 text-2xl font-bold leading-none text-ring">
						{`${TRACKS[0].pl.name}`}
					</h4>
					<h5 className="ml-6 mb-6 text-lg text-muted-foreground">{`${TRACKS[0].uNm}`}</h5>
					<button
						type="button"
						onClick={() => fireFavesCallback(playlistInfo)}
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
						href={`https://openwhyd.org/u/${params.userId}/playlist/${params.playlistId}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<ExternalLinkIcon className="ml-4 h-6 w-6 inline" />
					</a>
				</div>
			</div>
			<Table className="mx-6 mb-12 playlist-container">
				<TableHeader>
					<TableRow>
						<TableHead>No</TableHead>
						<TableHead className="hidden sm:table-cell"> </TableHead>
						<TableHead> </TableHead>
						<TableHead>Title</TableHead>
						<TableHead className="text-center">Link</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{TRACKS.map((track: Track, i: number, _) => (
						<TableRow key={track._id} className="group text-base">
							<TableCell>{i + 1}</TableCell>
							<TableCell className="hidden sm:table-cell w-16 pl-0 pr-4">
								<img
									alt="Track cover"
									aria-hidden
									className="aspect-square h-12 w-12 rounded-md object-cover"
									src={track.img}
								/>
							</TableCell>
							<TableCell className="px-0">
								<button
									className="h-fit w-fit mt-2 text-left"
									type="button"
									onClick={() => callback(TRACKS, i, playlistInfo)}
								>
									<PlayIcon className="mx-2 h-6 w-6 text-background group-hover:text-foreground text-right" />
								</button>
							</TableCell>
							<TableCell className="px-1">{track.name}</TableCell>
							<TableCell className="text-center">
								<a
									href={getYTUrl(track.eId)}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLinkIcon className="inline ml-6 h-5 w-5" />
								</a>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<ScrollToTop smooth className="toTopButton" />
		</>
	);
}

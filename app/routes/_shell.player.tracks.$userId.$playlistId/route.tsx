import { getYTUrl } from "@/components/music-player";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Track } from "@/types/openwhydObjects";
import { ExternalLinkIcon, PlayIcon, StarIcon } from "@radix-ui/react-icons";
import ScrollToTop from "react-scroll-to-top";

import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useOutletContext } from "react-router";

let PLAYLIST_URL = "";
export const loader = async ({ params }: LoaderFunctionArgs) => {
	PLAYLIST_URL = `https://openwhyd.org/u/${params.userId}/playlist/${params.playlistId}`;
	const res = await fetch(
		`https://openwhyd.org/u/${params.userId}/playlist/${params.playlistId}?format=json&limit=100`,
	);
	return await res.json();
};

interface ContextType {
	callback: (a: Array<Track>, b: number) => void;
}

export default function TracksList() {
	const TRACKS = useLoaderData<typeof loader>();
	const { callback } = useOutletContext<ContextType>();

	const location = useLocation();
	let playlistImg = TRACKS[0].img;
	const state = location.state;
	if (location.state !== null) playlistImg = state.playlistImg;

	return (
		<>
			<div className="mx-6 playlist-container p-6 mb-8 border-2 rounded-md h-52 flex bg-card">
				<img
					alt="Playlist cover"
					className="aspect-square h-40 w-40 rounded-md object-cover"
					src={playlistImg}
				/>
				<div>
					<h4 className="ml-6 mb-1 text-2xl font-bold leading-none text-ring">
						{`${TRACKS[0].pl.name}`}
					</h4>
					<h5 className="ml-6 mb-6 text-lg text-muted-foreground">{`${TRACKS[0].uNm}`}</h5>
					<StarIcon className="ml-6 h-6 w-6 inline" />
					<a href={PLAYLIST_URL}>
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
						<TableRow
							key={track._id}
							className="group text-base"
							onClick={() => callback(TRACKS, i)}
						>
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
								<PlayIcon className="ml-5 h-6 w-6 text-background group-hover:text-foreground text-right" />
							</TableCell>
							<TableCell className="px-1">{track.name}</TableCell>
							<TableCell className="text-center">
								<a href={getYTUrl(track.eId)}>
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

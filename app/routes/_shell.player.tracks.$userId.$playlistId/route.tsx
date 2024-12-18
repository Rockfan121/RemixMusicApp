import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ExternalLinkIcon, StarIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";

import type { Playlist } from "@/components/playlists";
import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

/*const USER_ID = "669b02cc904a229c1a956b3b";
export async function loader() {
	const res = await fetch(
		`https://openwhyd.org/u/${USER_ID}/playlist/0?format=json&limit=100`,
	);
	return json(await res.json());
}*/
let PLAYLIST_URL = "";
export const loader = async ({ params }: LoaderFunctionArgs) => {
	invariant(params.userId, "Missing userId param");
	invariant(params.playlistId, "Missing playlistId param");
	PLAYLIST_URL = `https://openwhyd.org/u/${params.userId}/playlist/${params.playlistId}`;
	const res = await fetch(
		`https://openwhyd.org/u/${params.userId}/playlist/${params.playlistId}?format=json&limit=100`,
	);
	return json(await res.json());
};

type PlaylistInfo = {
	id: number;
	name: string;
};

type RepostInfo = {
	pId: string;
	uId: string;
	uNm: string;
};

export type Track = {
	_id: string;
	uId: string;
	uNm: string;
	text: string;
	name: string;
	eId: string;
	pl: PlaylistInfo;
	img: string;
	repost: RepostInfo;
	lov: Array<string>;
	nbR: number;
	nbP: number;
};

export default function TracksList() {
	const TRACKS = useLoaderData<typeof loader>();
	return (
		<>
			<div className="mx-6 playlist-container p-6 mb-8 border-2 rounded-md h-52 flex bg-card">
				<img
					alt="Playlist cover"
					className="aspect-square h-40 w-40 rounded-md object-cover"
					src={`${TRACKS[0].img}`}
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
						<TableHead>Title</TableHead>
						<TableHead>Length</TableHead>
						<TableHead className="text-right">Link</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{TRACKS.map((track: Track, i: number, _) => (
						<TableRow key={track._id}>
							<TableCell className="font-medium">{i + 1}</TableCell>
							<TableCell className="hidden sm:table-cell w-16">
								<img
									alt="Track cover"
									aria-hidden
									className="aspect-square h-12 w-12 rounded-md object-cover"
									src={track.img}
								/>
							</TableCell>
							<TableCell>{track.name}</TableCell>
							<TableCell>2:00</TableCell>
							<TableCell className="text-right">
								<a href={track.eId}>
									<ExternalLinkIcon className="inline ml-6 h-5 w-5" />
								</a>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
				<TableFooter>
					<TableRow>
						<TableCell colSpan={3}>Total</TableCell>
						<TableCell className="text-right">32:10</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</>
	);
}

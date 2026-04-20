import { ExternalLinkIcon, PlayIcon } from "@radix-ui/react-icons";
import { memo, useCallback } from "react";
import { useOutletContext } from "react-router";
import ScrollToTop from "react-scroll-to-top";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getMusicServiceAndUrl } from "@/helpers/media-url";
import type { ContextType } from "@/types/context-type";
import type { ApiPlaylist, Track } from "@/types/openwhyd-types";
import UserLink from "../user-link";

interface TrackRowProps {
	track: Track;
	index: number;
	onPlay: (index: number) => void;
}

const TrackRow = memo(function TrackRow({
	track,
	index,
	onPlay,
}: TrackRowProps) {
	return (
		<TableRow>
			<TableCell>{index + 1}</TableCell>
			<TableCell className="w-16 pl-1 pr-4">
				<button
					className="size-13 mt-1 text-left relative"
					type="button"
					onClick={() => onPlay(index)}
				>
					<img
						aria-hidden
						className="aspect-square size-13 rounded-md object-cover bg-white"
						src={track.img}
						loading="lazy"
						decoding="async"
					/>
					<svg
						viewBox="-60 0 512 512"
						xmlns="http://www.w3.org/2000/svg"
						className="size-7 py-0.5 pl-1 pr-0 fill-white bg-black/40 block absolute top-3 left-3 rounded-full"
					>
						<title>play</title>
						<path d="M64 96L328 256 64 416 64 96Z" />
					</svg>
				</button>
			</TableCell>
			<TableCell className="px-1">
				<div className="text-sm lg:text-base">{track.name}</div>
				<div className="flex space-x-1.5 mt-1">
					<UserLink
						id={track.uId}
						name={track.uNm}
						isLarge={false}
						withImg={true}
					/>
					{track.repost && track.uId !== track.repost.uId ? (
						<>
							<div className="flex text-sm mr-2">via </div>
							<UserLink
								id={track.repost.uId}
								name={track.repost.uNm}
								isLarge={false}
								withImg={false}
							/>
						</>
					) : (
						""
					)}
				</div>
			</TableCell>
			<TableCell className="text-center">
				<a
					href={getMusicServiceAndUrl(track.eId)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<ExternalLinkIcon className="inline ml-6 h-5 w-5" />
				</a>
			</TableCell>
		</TableRow>
	);
});

interface TracksTableProps {
	children: Track[];
	apiplaylistInfo: ApiPlaylist;
}

/**
 * Component for displaying a given playlist.
 * It enables the user to start playing music, starting with the track clicked by the user.
 * The callback passes data to MusicPlayer and starts the player.
 */
export default function TracksTable({
	children,
	apiplaylistInfo,
}: TracksTableProps) {
	const { callback } = useOutletContext<ContextType>();

	const handlePlay = useCallback(
		(index: number) => {
			callback(children, index, apiplaylistInfo);
		},
		[callback, children, apiplaylistInfo],
	);

	return (
		<>
			<Table className="mx-4 mb-4 playlist-container">
				<TableHeader>
					<TableRow>
						<TableHead>No</TableHead>
						<TableHead> </TableHead>
						<TableHead>Title</TableHead>
						<TableHead className="text-center">Link</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{children.map((track: Track, i: number) => (
						<TrackRow
							key={track._id}
							track={track}
							index={i}
							onPlay={handlePlay}
						/>
					))}
				</TableBody>
			</Table>
			<ScrollToTop smooth className="to-top-button" />
		</>
	);
}

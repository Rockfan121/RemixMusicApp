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
		<TableRow className="group text-base">
			<TableCell>{index + 1}</TableCell>
			<TableCell className="hidden sm:table-cell w-16 pl-0 pr-4">
				<img
					alt="Track cover"
					aria-hidden
					className="aspect-square h-12 w-12 rounded-md object-cover"
					src={track.img}
					loading="lazy"
					decoding="async"
				/>
			</TableCell>
			<TableCell className="px-0">
				<button
					className="h-fit w-fit mt-2 text-left"
					type="button"
					onClick={() => onPlay(index)}
				>
					<PlayIcon className="mx-2 h-6 w-6 text-background group-hover:text-foreground text-right" />
				</button>
			</TableCell>
			<TableCell className="px-1">
				{track.name}
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

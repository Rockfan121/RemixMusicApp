import { ExternalLinkIcon, PlayIcon } from "@radix-ui/react-icons";
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
import { getYTUrl } from "@/helpers/media-url";
import type { ContextType } from "@/types/context-type";
import type { Track } from "@/types/openwhyd-types";
import type { XPlaylist } from "@/types/xplaylist-type";

interface TracksTableProps {
	children: Track[];
	xplaylistInfo: XPlaylist;
}

/**
 * Component for displaying a given playlists.
 * It enables the user to start playing music, starting with the track clicked by the user.
 * The callback passes data to MusicPlayer and starts the player.
 */
export default function TracksTable({
	children,
	xplaylistInfo,
}: TracksTableProps) {
	const { callback } = useOutletContext<ContextType>();

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
									onClick={() => callback(children, i, xplaylistInfo)}
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

import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TRACKS, TRACKS_COVER } from "@/mockData";
import { ExternalLinkIcon, StarIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";

export default function Playlist() {
	return (
		<>
			<div className="mx-6 playlist-container p-6 mb-8 border-2 rounded-md h-52 flex bg-card">
				<img
					alt="Track cover"
					className="aspect-square h-40 w-40 rounded-md object-cover"
					src={TRACKS_COVER}
				/>
				<div>
					<h4 className="ml-6 mb-2 text-2xl font-bold leading-none text-ring">
						Playlist...
					</h4>
					<h5 className="ml-6 mb-14 text-lg text-muted-foreground">Author</h5>
					<StarIcon className="ml-6 h-6 w-6 inline" />
					<ExternalLinkIcon className="ml-4 h-6 w-6 inline" />
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
					{TRACKS.map((track) => (
						<TableRow key={track.no}>
							<TableCell className="font-medium">{track.no}</TableCell>
							<TableCell className="hidden sm:table-cell w-16">
								<img
									alt="Track cover"
									className="aspect-square h-12 w-12 rounded-md object-cover"
									src={track.cover}
								/>
							</TableCell>
							<TableCell>{track.title}</TableCell>
							<TableCell>{track.length}</TableCell>
							<TableCell className="text-right">
								<Link to={track.link}>
									<ExternalLinkIcon className="inline ml-6 h-5 w-5" />
								</Link>
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

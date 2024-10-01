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
import { ExternalLinkIcon, StarIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";

const tracksCover =
	"https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80";

const tracks = [
	{
		no: "001",
		cover: tracksCover,
		title: "All Good Things - Fight",
		length: "2:00",
		link: "/",
	},
	{
		no: "002",
		cover: tracksCover,
		title: "All Good Things - Get Up",
		length: "3:00",
		link: "/",
	},
	{
		no: "003",
		cover: tracksCover,
		title: "Camel - Pressure Points",
		length: "1:10",
		link: "/",
	},
	{
		no: "004",
		cover: tracksCover,
		title: "IDOLIZE - Caleb Hyles",
		length: "2:00",
		link: "/",
	},
	{
		no: "005",
		cover: tracksCover,
		title: "JUST ONE STEP - Caleb Hyles",
		length: "3:00",
		link: "/",
	},
	{
		no: "006",
		cover: tracksCover,
		title: "Never Back Down [ft. @Manafest] - Caleb Hyles",
		length: "2:00",
		link: "/",
	},
	{
		no: "007",
		cover: tracksCover,
		title: 'Skillet - "Feel Invincible" [Official Music Video]',
		length: "4:00",
		link: "/",
	},
	{
		no: "008",
		cover: tracksCover,
		title: "Darkness Before The Dawn - Caleb Hyles",
		length: "5:00",
		link: "/",
	},
	{
		no: "009",
		cover: tracksCover,
		title: "Courtesy Call - Thousand Foot Krutch",
		length: "5:00",
		link: "/",
	},
	{
		no: "010",
		cover: tracksCover,
		title: "Official War of Change Music Video by Thousand Foot Krutch",
		length: "4:40",
		link: "/",
	},
	{
		no: "011",
		cover: tracksCover,
		title: "LEDGER: Completely [Official Video]",
		length: "2:00",
		link: "/",
	},
	{
		no: "012",
		cover: tracksCover,
		title: "UNPARALYZED [ft. Trevor McNevan]",
		length: "2:00",
		link: "/",
	},
	{
		no: "013",
		cover: tracksCover,
		title: "Skillet -“Stars” (The Shack Version)",
		length: "2:00",
		link: "/",
	},
];

export default function Playlist() {
	return (
		<>
			<div className="mx-6 playlist-container p-6 mb-8 border-2 rounded-md h-52 flex bg-card">
				<img
					alt="Track cover"
					className="aspect-square h-40 w-40 rounded-md object-cover"
					src={tracksCover}
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
			<Table className="mx-6 playlist-container">
				<TableCaption>Playlist title</TableCaption>
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
					{tracks.map((track) => (
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon, PaperPlaneIcon } from "@radix-ui/react-icons";

const playlists = Array.from({ length: 20 }).map(
	(_, i, a) => `${a.length - i}`,
);

export default function Playlists() {
	return (
		<>
			<div className="flex space-x-5 mx-6 mb-10">
				<h4 className="mx-4 text-lg text-ring">Explore playlists</h4>
				<div className="flex w-60 max-w-sm items-center space-x-1">
					<Input placeholder="Openwhyd username" type="search" />
					<Button type="submit" size="icon">
						<PaperPlaneIcon />
					</Button>
				</div>
				<div className="flex w-60 max-w-sm items-center space-x-1">
					<Input placeholder="Search" type="search" />
					<Button type="submit" size="icon">
						<MagnifyingGlassIcon />
					</Button>
					{/* <div
                aria-hidden
                hidden={true}
                id="search-spinner"
              /> */}
				</div>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10 mx-12 mb-16">
				{playlists.map((p) => (
					<figure key={p}>
						<div className="w-28 h-28 overflow-hidden rounded-md">
							<img
								src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
								alt={`Playlist no ${p} cover`}
								className="aspect-square h-fit w-fit object-cover"
							/>
						</div>
						<figcaption className="pt-1.5 text-sm text-muted-foreground">
							Author <br />
							<span className="font-semibold text-foreground">
								Playlist no {`${p}`}
							</span>
						</figcaption>
					</figure>
				))}
			</div>
		</>
	);
}

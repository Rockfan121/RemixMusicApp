import { Input } from "@/components/ui/input";
import { Form } from "@remix-run/react";

const playlists = Array.from({ length: 20 }).map(
	(_, i, a) => `${a.length - i}`,
);

export default function Playlists() {
	return (
		<>
			<div className="mx-6 mb-10">
				<h4 className="mr-10 text-2xl font-medium leading-none text-ring inline-block">
					Playlists
				</h4>
				<div className="w-52 inline-block">
					<Form id="search-form" role="search">
						<Input placeholder="Search" type="search" />
						{/* <div
                aria-hidden
                hidden={true}
                id="search-spinner"
              /> */}
					</Form>
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
							Playlist
							<span className="font-semibold text-foreground">
								{` no ${p}`}
							</span>
						</figcaption>
					</figure>
				))}
			</div>
		</>
	);
}
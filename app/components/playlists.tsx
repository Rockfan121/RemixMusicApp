import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";

export type Playlist = {
	no: string;
	title: string;
	author: string;
	cover: string;
	link: string;
};

export default function PlaylistsList({
	children,
	listIntro,
	hasUserSearch,
}: { children: Array<Playlist>; listIntro: string; hasUserSearch: boolean }) {
	let userSearchInput: React.ReactNode;
	if (hasUserSearch) {
		userSearchInput = (
			<div className="flex w-60 max-w-sm items-center space-x-1">
				<Input placeholder="Openwhyd username" type="search" />
				<Button type="submit" size="icon">
					<PaperPlaneIcon />
				</Button>
			</div>
		);
	} else {
		userSearchInput = <div />;
	}
	return (
		<>
			<div className="flex space-x-5 mx-6 mb-10">
				<h4 className="mx-4 text-lg text-ring">{listIntro}</h4>
				{userSearchInput}
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
				{children.map((p) => (
					<Link to={p.link} key={p.no}>
						<figure>
							<div className="w-28 h-28 overflow-hidden rounded-md">
								<img
									src={p.cover}
									alt={`${p.title} cover`}
									className="aspect-square h-fit w-fit object-cover"
								/>
							</div>
							<figcaption className="pt-1.5 text-sm text-muted-foreground">
								{`${p.author}`} <br />
								<span className="font-semibold text-foreground">
									{`${p.title}`}
								</span>
							</figcaption>
						</figure>
					</Link>
				))}
			</div>
		</>
	);
}

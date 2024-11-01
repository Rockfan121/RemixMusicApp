import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { user } from "@/db.server/schema";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";
import type React from "react";

export type Playlist = {
	id: string;
	name: string;
	url: string;
	nbTracks: number;
	img: string;
};

export default function PlaylistsList({
	children,
	listIntro,
	userName,
	userId,
}: {
	children?: Array<Playlist>;
	listIntro: string;
	userName?: string;
	userId?: string;
}) {
	//Link do tracks sparametryzowany uId (z danych wejściowych xD) oraz id (od playlisty)

	let userNameResolved = "";
	if (typeof userName !== "undefined") userNameResolved = userName;

	let userIdResolved = "";
	if (typeof userId !== "undefined") userIdResolved = userId;

	let content: React.ReactNode;
	if (typeof children !== "undefined" && children.length > 0) {
		content = children.map((p) => (
			<Link to={`/tracks/${userIdResolved}/${p.id}`} key={p.id}>
				<figure>
					<div className="w-28 h-28 overflow-hidden rounded-md">
						<img
							src={`https://openwhyd.org${p.img}`}
							alt={`${p.name} cover`}
							className="aspect-square h-fit w-fit object-cover"
						/>
					</div>
					<figcaption className="pt-1 text-sm text-muted-foreground">
						{`${userNameResolved}`} <br />
						<span className="font-semibold text-foreground">{`${p.name}`}</span>
					</figcaption>
				</figure>
			</Link>
		));
	} else {
		content = (
			<h4 className="text-center text-lg">{listIntro} list is empty!</h4>
		);
	}

	return (
		<>
			<div className="flex space-x-5 mx-6 mb-4">
				<h4 className="mx-4 text-lg text-ring">{listIntro}</h4>
				<div className="flex w-60 max-w-sm items-center space-x-1">
					<Input placeholder="Search" type="search" />
					<Button type="submit" size="icon" className="bg-secondary border">
						<MagnifyingGlassIcon />
					</Button>
					{/* <div
                aria-hidden
                hidden={true}
                id="search-spinner"
              /> */}
				</div>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 mx-12 mb-16">
				{content}
			</div>
		</>
	);
}

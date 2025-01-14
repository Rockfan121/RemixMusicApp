import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Playlist } from "@/types/openwhydObjects";
import { InfoCircledIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Link } from "@remix-run/react";
import type React from "react";

export default function PlaylistsList({
	children,
	listIntro,
	listEmptyText,
	userName,
	userId,
}: {
	children?: Array<Playlist>;
	listIntro: string;
	listEmptyText: string;
	userName?: string;
	userId?: string;
}) {
	//The way of rendering data need to be more flexible - in case of "faves" and "recent" lists usernames and userIds will be retrieved from db

	let userNameResolved = "";
	if (typeof userName !== "undefined") userNameResolved = userName;

	let userIdResolved = "";
	if (typeof userId !== "undefined") userIdResolved = userId;

	let content: React.ReactNode;
	let contentGrid: React.ReactNode;
	let searchInput: React.ReactNode;
	if (typeof children !== "undefined" && children.length > 0) {
		content = children.map((p) => (
			<Link
				to={`/player/tracks/${userIdResolved}/${p.id}`}
				key={p.id}
				state={{ playlistImg: `https://openwhyd.org${p.img}` }}
			>
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

		contentGrid = (
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 mx-12 mb-16">
				{content}
			</div>
		);

		searchInput = (
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
		);
	} else {
		content = (
			<Alert className="mx-10 w-auto">
				<InfoCircledIcon className="h-4 w-4" />
				<AlertDescription className="p-1">{listEmptyText}</AlertDescription>
			</Alert>
		);

		contentGrid = content;

		searchInput = <div />;
	}

	return (
		<>
			<div className="flex space-x-5 mx-6 mb-4">
				<h4 className="mx-4 text-lg text-ring">{listIntro}</h4>
				{searchInput}
			</div>
			{contentGrid}
		</>
	);
}

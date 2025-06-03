import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Playlist } from "@/types/openwhydObjects";
import { InfoCircledIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import type React from "react";
import ScrollToTop from "react-scroll-to-top";
import ConditionalLink from "./conditional-link";

/**
 * Component for browsing playlists
 * @param children - (optional) list of playlists to be listed
 * @param listIntro - The heading of the playlists view (i.e. "Explore playlists", "Recent playlists"...)
 * @param listEmptyText - The text to be displayed if there are no playlists to be listed
 * @param userName - The Openwhyd userName - the owner of the listed playlists (used only for "Explore playlists" view)
 * @param userId - The id of the Openwhyd userName (see above)
 */
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
	let userNameResolved = "";
	if (typeof userName !== "undefined") userNameResolved = userName;

	let userIdResolved = "";
	if (typeof userId !== "undefined") userIdResolved = userId;

	let content: React.ReactNode; //The playlists will be listed there
	let contentGrid: React.ReactNode; //The playlists covers will be aligned to grid
	let searchInput: React.ReactNode; //The search input for some playlist title (NOTE: it's just displayed, it doesn't work yet)
	if (typeof children !== "undefined" && children.length > 0) {
		content = children.map((p) => (
			<ConditionalLink
				userId={userIdResolved}
				userName={userNameResolved}
				playlist={p}
				key={p.id}
			/>
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
				<AlertDescription className="p-1 font-semibold">
					{listEmptyText}
				</AlertDescription>
			</Alert>
		);

		contentGrid = content;

		searchInput = <div />;
	}

	return (
		<>
			<div className="flex space-x-5 mx-6 mb-4">
				<h4 className="mx-4 text-xl font-bold text-ring">{listIntro}</h4>
				{searchInput}
			</div>
			{contentGrid}
			<ScrollToTop smooth className="toTopButton" />
		</>
	);
}

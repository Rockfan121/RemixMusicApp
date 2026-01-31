import { InfoCircledIcon } from "@radix-ui/react-icons";
import type React from "react";
import { useState } from "react";
import { Link } from "react-router";
import ScrollToTop from "react-scroll-to-top";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { imgUrl, myUrl } from "@/types/apiplaylist-helpers";
import type { ApiPlaylist, UserPlaylist } from "@/types/openwhyd-types";
import {
	allPlaylistInfo,
	hotPlaylistInfo,
	PlaylistsIDs,
	PlaylistsNames,
} from "@/types/playlists-types";
import ItemCover from "./item-cover";

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
	noOfLikes,
	noOfPosts,
}: {
	children?: Array<UserPlaylist> | Array<ApiPlaylist>;
	listIntro: string;
	listEmptyText: string;
	userName?: string;
	userId?: string;
	noOfLikes?: number;
	noOfPosts?: number;
}) {
	const [localQuery, setLocalQuery] = useState("");

	let userNameResolved = "";
	if (typeof userName !== "undefined") userNameResolved = userName;

	let userIdResolved = "";
	if (typeof userId !== "undefined") userIdResolved = userId;

	let noOfPostsResolved = -1;
	if (typeof noOfPosts !== "undefined") noOfPostsResolved = noOfPosts;

	let noOfLikesResolved = -1;
	if (typeof noOfLikes !== "undefined") noOfLikesResolved = noOfLikes;

	let playlists: React.ReactNode; //The playlists will be listed there
	let specialPlaylists: React.ReactNode; //The playlists like All, Hot, Likes
	let contentGrid: React.ReactNode; //The playlists covers will be aligned to grid
	let searchInput: React.ReactNode; //The search input for some playlist title

	function handleQueryChange(e: { target: { value: string } }) {
		setLocalQuery(e.target.value);
	}

	if (typeof children !== "undefined" && children.length > 0) {
		if (userIdResolved === "") {
			const apiPlaylists = children as ApiPlaylist[];
			const filteredApiPlaylist =
				localQuery !== ""
					? apiPlaylists.filter((p) =>
							p.name.toLowerCase().includes(localQuery?.toLowerCase() || ""),
						)
					: apiPlaylists;
			playlists = filteredApiPlaylist.map((p) => (
				<Link to={myUrl(p)} key={p.id}>
					<ItemCover
						title={p.name}
						subtitle={p.uNm}
						coverImg={imgUrl(p.id)}
						altText="ApiPlaylist cover"
					/>
				</Link>
			));
		} else {
			const userPlaylists = children as UserPlaylist[];
			const userSpecialPlaylists = [
				{
					id: PlaylistsIDs.UserAll,
					name: PlaylistsNames.UserAll,
					uId: userIdResolved,
					uNm: userNameResolved,
					//url: `/player/tracks/${userIdResolved}/all`,
					plId: "",
					nbTracks: noOfPostsResolved,
				},
				{
					id: PlaylistsIDs.UserLikes,
					name: PlaylistsNames.UserLikes,
					uId: userIdResolved,
					uNm: userNameResolved,
					//url: `/player/tracks/${userIdResolved}/likes`,
					plId: "",
					nbTracks: noOfLikesResolved,
				},
				{
					id: PlaylistsIDs.UserStream,
					name: PlaylistsNames.UserStream,
					uId: userIdResolved,
					uNm: userNameResolved,
					//url: `/player/tracks/${userIdResolved}/stream`,
					plId: "",
					nbTracks: -1,
				},
			];

			const filteredUserPlaylists =
				localQuery !== ""
					? userPlaylists.filter((p) =>
							p.name.toLowerCase().includes(localQuery?.toLowerCase() || ""),
						)
					: userPlaylists;

			specialPlaylists = userSpecialPlaylists.map((p) => (
				<Link to={myUrl(p)} key={p.id}>
					<ItemCover
						title={p.name}
						subtitle={p.uNm}
						coverImg={imgUrl(p.id)}
						altText="UserPlaylist cover"
					/>
				</Link>
			));

			playlists = filteredUserPlaylists.map((p) => (
				<Link to={`/player/tracks/${userIdResolved}/${p.id}`} key={p.url}>
					<ItemCover
						title={p.name}
						subtitle={userNameResolved}
						coverImg={imgUrl(`${userIdResolved}_${p.id}`)}
						altText="UserPlaylist cover"
					/>
				</Link>
			));
		}

		contentGrid = (
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 mx-12 mb-16">
				{specialPlaylists}
				{playlists}
			</div>
		);

		searchInput = (
			<div className="flex w-60 max-w-sm items-center space-x-1">
				<Input
					className="search-input"
					placeholder="Search"
					type="search"
					id="localQuery"
					name="pl"
					onChange={handleQueryChange}
				/>
			</div>
		);
	} else {
		const globalSpecialPlaylists = [allPlaylistInfo, hotPlaylistInfo];

		specialPlaylists = globalSpecialPlaylists.map((p) => (
			<Link to={myUrl(p)} key={p.id}>
				<ItemCover
					title={p.name}
					subtitle={p.uNm}
					coverImg={imgUrl(p.id)}
					altText="UserPlaylist cover"
				/>
			</Link>
		));

		playlists = (
			<Alert className="mx-10 w-auto">
				<InfoCircledIcon className="h-4 w-4" />
				<AlertDescription className="p-1 font-semibold">
					{listEmptyText}
				</AlertDescription>
			</Alert>
		);

		contentGrid = (
			<>
				{playlists}
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 mx-12 mb-16 mt-10">
					{specialPlaylists}
				</div>
			</>
		);

		searchInput = <div />;
	}

	return (
		<>
			<div className="flex space-x-5 mx-6 mb-4">
				<h4 className="mx-4 text-xl font-bold text-ring">{listIntro}</h4>
				{searchInput}
			</div>
			{contentGrid}
			<ScrollToTop smooth className="to-top-button" />
		</>
	);
}

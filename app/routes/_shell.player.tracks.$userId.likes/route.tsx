import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { MAX_FETCHED_ITEMS, title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { apiPlaylist, userLikesPlaylist } from "@/services/openwhyd";
import { PlaylistType } from "@/types/apiplaylist-helpers";
import type { ApiPlaylist } from "@/types/openwhyd-types";

const PAGE_TITLE = "Likes";

//Fetch all tracks by one of Openwhyd users
export const loader = async ({ params }: LoaderFunctionArgs) => {
	await new Promise(timeout300);
	const api_res = await fetch(apiPlaylist(params.userId, ""));

	if (api_res.status === 200) {
		await new Promise(timeout300);
		const user_res = await fetch(userLikesPlaylist(params.userId));

		if (user_res.status !== 200) {
			return {
				PLAYLIST_INFO: await api_res.json(),
				TRACKS: {},
			};
		}

		return {
			PLAYLIST_INFO: await api_res.json(),
			TRACKS: await user_res.json(),
		};
	}
	return {
		PLAYLIST_INFO: {},
		TRACKS: {},
	};
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (typeof data !== "undefined") {
		return [
			{
				title: title(`${PAGE_TITLE} - ${data.PLAYLIST_INFO[0].uNm}`),
			},
		];
	}
	return [{ title: title("Playlist not found") }];
};

export default function UserAllTracks() {
	const { PLAYLIST_INFO, TRACKS } = useLoaderData<typeof loader>();

	const userLikesInfo: ApiPlaylist = {
		id: PlaylistType.UserLikes,
		name: `${PAGE_TITLE}`,
		uId: PLAYLIST_INFO[0].uId,
		uNm: PLAYLIST_INFO[0].uNm,
		plId: "",
		nbTracks: MAX_FETCHED_ITEMS,
	};

	return <TracksContainer playlistInfo={userLikesInfo} tracks={TRACKS} />;
}

import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { MAX_FETCHED_ITEMS, title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { apiUser, userLikesPlaylist } from "@/services/openwhyd";
import type { ApiPlaylist } from "@/types/openwhyd-types";
import { PlaylistsIDs, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.UserLikes;

//Fetch all tracks by one of Openwhyd users
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const afterId = new URL(request.url).searchParams.get("after") ?? undefined;
	await new Promise(timeout300);
	const api_res = await fetch(apiUser(params.userId));

	if (api_res.status === 200) {
		await new Promise(timeout300);
		const user_res = await fetch(userLikesPlaylist(params.userId, afterId));

		if (user_res.status !== 200) {
			return {
				USER_INFO: await api_res.json(),
				TRACKS: {},
				hasMore: false,
			};
		}

		const tracks = await user_res.json();
		return {
			USER_INFO: await api_res.json(),
			TRACKS: tracks,
			hasMore: Array.isArray(tracks) && tracks.length === 21,
		};
	}
	return {
		USER_INFO: {},
		TRACKS: {},
		hasMore: false,
	};
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	if (typeof loaderData !== "undefined") {
		return [
			{
				title: title(`${PAGE_TITLE} - ${loaderData.USER_INFO.name}`),
			},
		];
	}
	return [{ title: title("Playlist not found") }];
};

export default function UserAllTracks() {
	const { USER_INFO, TRACKS, hasMore } = useLoaderData<typeof loader>();

	const userLikesInfo: ApiPlaylist = {
		id: PlaylistsIDs.UserLikes,
		name: `${PAGE_TITLE}`,
		uId: USER_INFO.id,
		uNm: USER_INFO.name,
		plId: "",
		nbTracks: USER_INFO.nbLikes,
	};

	return (
		<TracksContainer
			playlistInfo={userLikesInfo}
			tracks={TRACKS}
			hasMore={hasMore}
		/>
	);
}

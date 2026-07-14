import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { title } from "@/config.shared";
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
		const userInfo = await api_res.json();
		await new Promise(timeout300);
		const user_res = await fetch(userLikesPlaylist(params.userId, afterId));

		const playlistInfo: ApiPlaylist = {
			id: PlaylistsIDs.UserLikes,
			name: `${PAGE_TITLE}`,
			uId: userInfo.id,
			uNm: userInfo.name,
			plId: "",
			nbTracks: userInfo.nbLikes,
		};

		if (user_res.status !== 200) {
			return {
				playlistInfo,
				TRACKS: {},
				hasMore: false,
			};
		}

		const tracks = await user_res.json();
		return {
			playlistInfo,
			TRACKS: tracks,
			hasMore: Array.isArray(tracks) && tracks.length === 21,
		};
	}
	return {
		playlistInfo: null,
		TRACKS: {},
		hasMore: false,
	};
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	if (loaderData?.playlistInfo) {
		return [
			{
				title: title(`${PAGE_TITLE} - ${loaderData.playlistInfo.uNm}`),
			},
		];
	}
	return [{ title: title("Playlist not found") }];
};

export default function UserLikesView() {
	const { playlistInfo, TRACKS, hasMore } = useLoaderData<typeof loader>();

	return (
		<TracksContainer
			playlistInfo={
				playlistInfo ?? {
					id: PlaylistsIDs.UserLikes,
					name: PAGE_TITLE,
					uId: "",
					uNm: "",
					plId: "",
					nbTracks: 0,
				}
			}
			tracks={TRACKS}
			hasMore={hasMore}
		/>
	);
}

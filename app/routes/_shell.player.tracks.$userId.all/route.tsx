import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { apiUser, userAllPlaylist } from "@/services/openwhyd";
import type { ApiPlaylist } from "@/types/openwhyd-types";
import { PlaylistsIDs, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.UserAll;

//Fetch all tracks by one of Openwhyd users
export const loader = async ({ params }: LoaderFunctionArgs) => {
	await new Promise(timeout300);
	const api_res = await fetch(apiUser(params.userId));

	if (api_res.status === 200) {
		await new Promise(timeout300);
		const user_res = await fetch(userAllPlaylist(params.userId));

		if (user_res.status !== 200) {
			return {
				USER_INFO: await api_res.json(),
				TRACKS: {},
			};
		}

		return {
			USER_INFO: await api_res.json(),
			TRACKS: await user_res.json(),
		};
	}
	return {
		USER_INFO: {},
		TRACKS: {},
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
	const { USER_INFO, TRACKS } = useLoaderData<typeof loader>();

	const userAllPlaylistInfo: ApiPlaylist = {
		id: PlaylistsIDs.UserAll,
		name: `${PAGE_TITLE}`,
		uId: USER_INFO.id,
		uNm: USER_INFO.name,
		plId: "",
		nbTracks: USER_INFO.nbPosts,
	};

	return <TracksContainer playlistInfo={userAllPlaylistInfo} tracks={TRACKS} />;
}

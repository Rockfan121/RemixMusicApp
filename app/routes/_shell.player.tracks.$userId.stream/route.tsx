import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { apiUser, userStreamPlaylist } from "@/services/openwhyd";
import type { ApiPlaylist } from "@/types/openwhyd-types";
import { PlaylistsIDs, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.UserStream;

//Fetch all tracks by one of Openwhyd users
export const loader = async ({ params }: LoaderFunctionArgs) => {
	await new Promise(timeout300);
	const api_res = await fetch(apiUser(params.userId));

	if (api_res.status === 200) {
		await new Promise(timeout300);
		const user_res = await fetch(userStreamPlaylist(params.userId));

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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (typeof data !== "undefined") {
		return [
			{
				title: title(`${PAGE_TITLE} - ${data.USER_INFO.uNm}`),
			},
		];
	}
	return [{ title: title("Playlist not found") }];
};

export default function UserStreamTracks() {
	const { USER_INFO, TRACKS } = useLoaderData<typeof loader>();

	const userStreamInfo: ApiPlaylist = {
		id: PlaylistsIDs.UserStream,
		name: `${PAGE_TITLE}`,
		uId: USER_INFO.id,
		uNm: USER_INFO.name,
		plId: "",
		nbTracks: -1,
	};

	return <TracksContainer playlistInfo={userStreamInfo} tracks={TRACKS} />;
}

import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { fetchUserSpecialPlaylist } from "@/services/openwhyd";
import type { Track } from "@/types/openwhyd-types";
import { PlaylistsIDs, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.UserAll;

//Fetch all tracks by one of Openwhyd users
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const afterId = new URL(request.url).searchParams.get("after") ?? undefined;
	await new Promise(timeout300);
	const result = await fetchUserSpecialPlaylist(params.userId, "all", afterId);

	if (!result) {
		return { playlistInfo: null, TRACKS: [] as Track[], hasMore: false };
	}
	return {
		playlistInfo: result.playlistInfo,
		TRACKS: result.tracks,
		hasMore: result.hasMore,
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

export default function UserAllTracks() {
	const { playlistInfo, TRACKS, hasMore } = useLoaderData<typeof loader>();

	return (
		<TracksContainer
			playlistInfo={
				playlistInfo ?? {
					id: PlaylistsIDs.UserAll,
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

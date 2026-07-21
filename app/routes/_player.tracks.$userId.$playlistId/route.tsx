import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useParams } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import TracksHeader from "@/components/table/tracks-header";
import TracksReplacement from "@/components/table/tracks-replacement";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { fetchApiPlaylist, fetchUserPlaylist } from "@/services/openwhyd";
import type { ApiPlaylist } from "@/types/openwhyd-types";

//Fetch tracks from one of Openwhyd users playlists
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const afterId = new URL(request.url).searchParams.get("after") ?? undefined;
	await new Promise(timeout300);
	const playlistInfo = await fetchApiPlaylist(params.userId, params.playlistId);

	if (!playlistInfo) {
		return { PLAYLIST_INFO: [], TRACKS: [], hasMore: false };
	}

	await new Promise(timeout300);
	const userTracks = await fetchUserPlaylist(
		params.userId,
		params.playlistId,
		afterId,
	);

	if (!userTracks) {
		return { PLAYLIST_INFO: playlistInfo, TRACKS: {}, hasMore: false };
	}

	return {
		PLAYLIST_INFO: playlistInfo,
		TRACKS: userTracks.tracks,
		hasMore: userTracks.hasMore,
	};
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	if (typeof loaderData !== "undefined") {
		if (
			!loaderData.PLAYLIST_INFO ||
			!Object.hasOwn(loaderData.PLAYLIST_INFO[0], "name")
		) {
			return [{ title: title("Playlist not found") }];
		}
		return [
			{
				title: title(
					`${loaderData.PLAYLIST_INFO[0].name} by ${loaderData.PLAYLIST_INFO[0].uNm}`,
				),
			},
		];
	}
	return [{ title: title("Playlist not found") }];
};

export default function TracksView() {
	const { PLAYLIST_INFO, TRACKS, hasMore } = useLoaderData<typeof loader>();
	const params = useParams();

	if (!PLAYLIST_INFO || !Object.hasOwn(PLAYLIST_INFO[0], "name")) {
		const nonexistentPlaylist: ApiPlaylist = {
			// No playlist found - it doesn't exist
			id: `${params.userId}_${params.playlistId}`,
			name: "",
			uId: `${params.userId}`,
			uNm: "",
			plId: `${params.playlistId}`,
			nbTracks: 0,
		};

		return (
			<>
				<TracksHeader apiplaylistInfo={nonexistentPlaylist} />
				<TracksReplacement doesExist={false} />
			</>
		);
	}

	const playlistInfo: ApiPlaylist = {
		id: PLAYLIST_INFO[0].id,
		name: PLAYLIST_INFO[0].name,
		uId: PLAYLIST_INFO[0].uId,
		uNm: PLAYLIST_INFO[0].uNm,
		plId: PLAYLIST_INFO[0].plId,
		nbTracks: PLAYLIST_INFO[0].nbTracks,
	};

	return (
		<TracksContainer
			playlistInfo={playlistInfo}
			tracks={TRACKS}
			hasMore={hasMore}
		/>
	);
}

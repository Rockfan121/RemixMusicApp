import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useParams } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import TracksHeader from "@/components/table/tracks-header";
import TracksReplacement from "@/components/table/tracks-replacement";
import { MAX_FETCHED_ITEMS, title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { apiPlaylist, userPlaylist } from "@/services/openwhyd";
import type { ApiPlaylist } from "@/types/openwhyd-types";

//Fetch tracks from one of Openwhyd users playlists
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
	const afterId = new URL(request.url).searchParams.get("after") ?? undefined;
	await new Promise(timeout300);
	const api_res = await fetch(apiPlaylist(params.userId, params.playlistId));

	if (api_res.status === 200) {
		await new Promise(timeout300);
		const user_res = await fetch(
			userPlaylist(params.userId, params.playlistId, afterId),
		);

		const text_user_res = await user_res.clone();
		if (user_res.status !== 200 || (await text_user_res.text())[0] === "m") {
			return {
				PLAYLIST_INFO: await api_res.json(),
				TRACKS: {},
				hasMore: false,
			};
		}

		const tracks = await user_res.json();
		return {
			PLAYLIST_INFO: await api_res.json(),
			TRACKS: tracks,
			hasMore: Array.isArray(tracks) && tracks.length === MAX_FETCHED_ITEMS,
		};
	}
	return {
		PLAYLIST_INFO: {},
		TRACKS: {},
		hasMore: false,
	};
};

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
	if (typeof loaderData !== "undefined") {
		if (!Object.hasOwn(loaderData.PLAYLIST_INFO[0], "name")) {
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

	if (!Object.hasOwn(PLAYLIST_INFO[0], "name")) {
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

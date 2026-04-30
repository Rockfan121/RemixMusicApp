import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { MAX_FETCHED_ITEMS, title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { hotPlaylist } from "@/services/openwhyd";
import { hotPlaylistInfo, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.Hot;

//Fetch list of hot tracks on Openwhyd
export const loader = async ({ request }: LoaderFunctionArgs) => {
	const skip = Number(new URL(request.url).searchParams.get("skip") ?? 0);
	await new Promise(timeout300);
	const hot_res = await fetch(hotPlaylist(skip || undefined));

	if (hot_res.status === 200) {
		const data = await hot_res.json();
		const tracks = data?.tracks ?? [];
		return {
			TRACKS: data,
			hasMore: Array.isArray(tracks) && tracks.length === MAX_FETCHED_ITEMS,
		};
	}
	return { TRACKS: {}, hasMore: false };
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function HotTracks() {
	const { TRACKS, hasMore } = useLoaderData<typeof loader>();

	return (
		<TracksContainer
			playlistInfo={hotPlaylistInfo}
			tracks={TRACKS.tracks}
			hasMore={hasMore}
		/>
	);
}

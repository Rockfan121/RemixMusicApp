import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { fetchAllPlaylist } from "@/services/openwhyd";
import { allPlaylistInfo, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.All;

//Fetch list of all Openwhyd tracks (starting from the most recent ones)
export const loader = async ({ request }: LoaderFunctionArgs) => {
	const afterId = new URL(request.url).searchParams.get("after") ?? undefined;
	await new Promise(timeout300);
	try {
		const { tracks, hasMore } = await fetchAllPlaylist(afterId);
		return { TRACKS: tracks, hasMore };
	} catch {
		return { TRACKS: {}, hasMore: false };
	}
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function AllTracks() {
	const { TRACKS, hasMore } = useLoaderData<typeof loader>();

	return (
		<TracksContainer
			playlistInfo={allPlaylistInfo}
			tracks={TRACKS}
			hasMore={hasMore}
		/>
	);
}

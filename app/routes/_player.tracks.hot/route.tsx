import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { fetchHotPlaylist } from "@/services/openwhyd";
import { hotPlaylistInfo, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.Hot;

//Fetch list of hot tracks on Openwhyd
export const loader = async ({ request }: LoaderFunctionArgs) => {
	const skip = Number(new URL(request.url).searchParams.get("skip") ?? 0);
	await new Promise(timeout300);
	try {
		const { raw, hasMore } = await fetchHotPlaylist(skip || undefined);
		return { TRACKS: raw, hasMore };
	} catch {
		return { TRACKS: {}, hasMore: false };
	}
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

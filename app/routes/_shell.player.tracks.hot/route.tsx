import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { hotPlaylist } from "@/services/openwhyd";
import { hotPlaylistInfo, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.Hot;

//Fetch list of hot tracks on Openwhyd
export const loader = async () => {
	await new Promise(timeout300);
	const hot_res = await fetch(hotPlaylist());

	return hot_res.status === 200
		? { TRACKS: await hot_res.json() }
		: { TRACKS: {} };
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function HotTracks() {
	const { TRACKS } = useLoaderData<typeof loader>();

	return (
		<TracksContainer playlistInfo={hotPlaylistInfo} tracks={TRACKS.tracks} />
	);
}

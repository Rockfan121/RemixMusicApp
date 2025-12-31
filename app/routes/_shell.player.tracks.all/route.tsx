import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { allPlaylist } from "@/services/openwhyd";
import { allPlaylistInfo, PlaylistsNames } from "@/types/playlists-types";

const PAGE_TITLE = PlaylistsNames.All;

//Fetch list of all Openwhyd tracks (starting from the most recent ones)
export const loader = async () => {
	await new Promise(timeout300);
	const all_res = await fetch(allPlaylist());

	return all_res.status === 200
		? { TRACKS: await all_res.json() }
		: { TRACKS: {} };
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function AllTracks() {
	const { TRACKS } = useLoaderData<typeof loader>();

	return <TracksContainer playlistInfo={allPlaylistInfo} tracks={TRACKS} />;
}

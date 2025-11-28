import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { MAX_FETCHED_ITEMS, title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { hotPlaylist } from "@/services/openwhyd";
import { PlaylistType } from "@/types/apiplaylist-helpers";
import type { ApiPlaylist } from "@/types/openwhyd-types";

const PAGE_TITLE = "Hot tracks";

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

	const hotPlaylistInfo: ApiPlaylist = {
		id: PlaylistType.Hot,
		name: PAGE_TITLE,
		uId: "",
		uNm: "",
		plId: "",
		nbTracks: MAX_FETCHED_ITEMS,
	};

	return (
		<TracksContainer playlistInfo={hotPlaylistInfo} tracks={TRACKS.tracks} />
	);
}

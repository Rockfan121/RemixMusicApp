import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TracksContainer from "@/components/table/tracks-container";
import { MAX_FETCHED_ITEMS, title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { allPlaylist } from "@/services/openwhyd";
import { PlaylistType } from "@/types/apiplaylist-helpers";
import type { ApiPlaylist } from "@/types/openwhyd-types";

const PAGE_TITLE = "Recent tracks from all users";

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

	const allPlaylistInfo: ApiPlaylist = {
		id: PlaylistType.All,
		name: PAGE_TITLE,
		uId: "",
		uNm: "",
		plId: "",
		nbTracks: MAX_FETCHED_ITEMS,
	};

	return <TracksContainer playlistInfo={allPlaylistInfo} tracks={TRACKS} />;
}

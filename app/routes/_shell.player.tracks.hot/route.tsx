import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TableReplacement from "@/components/table/table-replacement";
import TracksHeader from "@/components/table/tracks-header";
import TracksTable from "@/components/table/tracks-table";
import { MAX_FETCHED_ITEMS, title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { hotPlaylist } from "@/services/openwhyd";
import type { ApiPlaylist } from "@/types/openwhyd-types";

const PAGE_TITLE = "Hot tracks";

/**
 * Fetch tracks from one of Openwhyd users playlists
 */
export const loader = async () => {
	await new Promise(timeout300);
	const hot_res = await fetch(hotPlaylist());

	if (hot_res.status === 200) {
		return {
			HOT_TRACKS: await hot_res.json(),
		};
	}
	return {
		HOT_TRACKS: {},
	};
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function HotTracks() {
	const { HOT_TRACKS } = useLoaderData<typeof loader>();

	const apiplaylistInfo: ApiPlaylist = {
		id: "hot",
		name: PAGE_TITLE,
		uId: "",
		uNm: "",
		plId: "",
		nbTracks: MAX_FETCHED_ITEMS,
	};

	if (Object.keys(HOT_TRACKS.tracks).length === 0) {
		return (
			// No tracks found - the playlist is empty
			<>
				<TracksHeader apiplaylistInfo={apiplaylistInfo} />
				<TableReplacement doesExist={true} />
			</>
		);
	}

	return (
		// Playlist and tracks found - display them
		<>
			<TracksHeader apiplaylistInfo={apiplaylistInfo} />
			<TracksTable apiplaylistInfo={apiplaylistInfo}>
				{HOT_TRACKS.tracks}
			</TracksTable>
		</>
	);
}

import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import TableReplacement from "@/components/table/table-replacement";
import TracksHeader from "@/components/table/tracks-header";
import TracksTable from "@/components/table/tracks-table";
import { MAX_FETCHED_ITEMS, title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { allPlaylist } from "@/services/openwhyd";
import type { ApiPlaylist } from "@/types/openwhyd-types";

const PAGE_TITLE = "Recent tracks from all users";

/**
 * Fetch tracks from one of Openwhyd users playlists
 */
export const loader = async () => {
	await new Promise(timeout300);
	const all_res = await fetch(allPlaylist());

	if (all_res.status === 200) {
		return {
			ALL_TRACKS: await all_res.json(),
		};
	}
	return {
		ALL_TRACKS: {},
	};
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function AllTracks() {
	const { ALL_TRACKS } = useLoaderData<typeof loader>();

	const apiplaylistInfo: ApiPlaylist = {
		id: "all",
		name: PAGE_TITLE,
		uId: "",
		uNm: "",
		plId: "",
		nbTracks: MAX_FETCHED_ITEMS,
	};

	if (Object.keys(ALL_TRACKS).length === 0) {
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
			<TracksTable apiplaylistInfo={apiplaylistInfo}>{ALL_TRACKS}</TracksTable>
		</>
	);
}

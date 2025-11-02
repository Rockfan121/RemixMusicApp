import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useParams } from "react-router";

import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { apiPlaylist, userPlaylist } from "@/services/openwhyd";
import type { XPlaylist } from "@/types/xplaylist-type";
import TableReplacement from "./components/table-replacement";
import TracksHeader from "./components/tracks-header";
import TracksTable from "./components/tracks-table";

/**
 * Fetch tracks from one of Openwhyd users playlists
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
	await new Promise(timeout300);
	const api_res = await fetch(apiPlaylist(params.userId, params.playlistId));

	if (api_res.status === 200) {
		await new Promise(timeout300);
		const user_res = await fetch(
			userPlaylist(params.userId, params.playlistId),
		);

		const text_user_res = await user_res.clone();
		if ((await text_user_res.text())[0] === "m") {
			return {
				PLAYLIST_INFO: await api_res.json(),
				TRACKS: {},
			};
		}

		return {
			PLAYLIST_INFO: await api_res.json(),
			TRACKS: await user_res.json(),
		};
	}
	return {
		PLAYLIST_INFO: {},
		TRACKS: {},
	};
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (typeof data !== "undefined") {
		if (!Object.hasOwn(data.PLAYLIST_INFO[0], "name")) {
			return [{ title: title("Playlist not found") }];
		}
		return [
			{
				title: title(
					`${data.PLAYLIST_INFO[0].name} by ${data.PLAYLIST_INFO[0].uNm}`,
				),
			},
		];
	}
	return [{ title: title("Playlist not found") }];
};

/**
 * Component for displaying a given playlists.
 * It enables the user to start playing music, starting with the track clicked by the user.
 * The callback passes data to MusicPlayer and starts the player.
 */
export default function TracksView() {
	const { PLAYLIST_INFO, TRACKS } = useLoaderData<typeof loader>();
	const params = useParams();

	if (!Object.hasOwn(PLAYLIST_INFO[0], "name")) {
		const nonexistentPlaylist: XPlaylist = {
			// No playlist found - it doesn't exist
			id: `${params.userId}_${params.playlistId}`,
			name: "",
			uId: `${params.userId}`,
			uNm: "",
			plId: `${params.playlistId}`,
			nbTracks: 0,
			doesExist: false,
		};

		return (
			<>
				<TracksHeader xplaylistInfo={nonexistentPlaylist} />
				<TableReplacement doesExist={false} />
			</>
		);
	}

	const xplaylistInfo: XPlaylist = {
		id: PLAYLIST_INFO[0].id,
		name: PLAYLIST_INFO[0].name,
		uId: PLAYLIST_INFO[0].uId,
		uNm: PLAYLIST_INFO[0].uNm,
		plId: PLAYLIST_INFO[0].plId,
		nbTracks: PLAYLIST_INFO[0].nbTracks,
		doesExist: true,
	};

	if (Object.keys(TRACKS).length === 0) {
		return (
			// No tracks found - the playlist is empty
			<>
				<TracksHeader xplaylistInfo={xplaylistInfo} />
				<TableReplacement doesExist={true} />
			</>
		);
	}

	return (
		// Playlist and tracks found - display them
		<>
			<TracksHeader xplaylistInfo={xplaylistInfo} />
			<TracksTable xplaylistInfo={xplaylistInfo}>{TRACKS}</TracksTable>
		</>
	);
}

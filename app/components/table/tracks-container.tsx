import type { ApiPlaylist, Track } from "@/types/openwhyd-types";
import TracksHeader from "./tracks-header";
import TracksReplacement from "./tracks-replacement";
import TracksTable from "./tracks-table";

export default function TracksContainer({
	playlistInfo,
	tracks,
}: {
	playlistInfo: ApiPlaylist;
	tracks: Track[];
}) {
	if (Object.keys(tracks).length === 0) {
		return (
			// No tracks found - the playlist is empty
			<>
				<TracksHeader apiplaylistInfo={playlistInfo} />
				<TracksReplacement doesExist={true} />
			</>
		);
	}

	return (
		// Playlist and tracks found - display them
		<>
			<TracksHeader apiplaylistInfo={playlistInfo} />
			<TracksTable apiplaylistInfo={playlistInfo}>{tracks}</TracksTable>
		</>
	);
}

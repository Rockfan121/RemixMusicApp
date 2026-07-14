import { Button } from "@/components/ui/button";
import type { ApiPlaylist, Track } from "@/types/openwhyd-types";
import TracksHeader from "./tracks-header";
import TracksReplacement from "./tracks-replacement";
import TracksTable from "./tracks-table";
import { useTracksLoader } from "./use-tracks-loader";

export default function TracksContainer({
	playlistInfo,
	tracks,
	hasMore,
}: {
	playlistInfo: ApiPlaylist;
	tracks: Track[];
	hasMore: boolean;
}) {
	const { allTracks, canLoadMore, fetcher, handleLoadMore } = useTracksLoader(
		tracks,
		hasMore,
	);

	if (!tracks) {
		//dodac komunikat, ze playlista nie mogla zostac zaladowana - sprobuj pozniej
		return (
			// No tracks found - the playlist is empty
			<>
				<TracksHeader apiplaylistInfo={playlistInfo} />
				<TracksReplacement doesExist={true} />
			</>
		);
	}
	if (tracks && Object.keys(tracks).length === 0) {
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
			<TracksTable apiplaylistInfo={playlistInfo}>{allTracks}</TracksTable>
			{canLoadMore && (
				<div className="flex justify-center mb-10">
					<Button
						onClick={handleLoadMore}
						disabled={fetcher.state !== "idle"}
						className="w-xs"
					>
						{fetcher.state !== "idle" ? "Loading…" : "Load More"}
					</Button>
				</div>
			)}
		</>
	);
}

import { useEffect, useRef, useState } from "react";
import { useFetcher, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import type { ApiPlaylist, Track } from "@/types/openwhyd-types";
import { HOT_TRACKS_LINK } from "@/types/playlists-types";
import TracksHeader from "./tracks-header";
import TracksReplacement from "./tracks-replacement";
import TracksTable from "./tracks-table";

export default function TracksContainer({
	playlistInfo,
	tracks,
	hasMore,
}: {
	playlistInfo: ApiPlaylist;
	tracks: Track[];
	hasMore: boolean;
}) {
	const location = useLocation();
	// Key the fetcher to the current pathname so navigating to a new playlist
	// always starts with a clean fetcher (no stale data from the previous route).
	const fetcher = useFetcher<{
		TRACKS: Track[] | { tracks: Track[] };
		hasMore: boolean;
	}>({
		key: location.pathname,
	});

	const [allTracks, setAllTracks] = useState<Track[]>(
		Array.isArray(tracks) ? tracks : [],
	);
	const [canLoadMore, setCanLoadMore] = useState(hasMore);

	// Reset accumulated tracks when the route's initial data changes (new navigation).
	useEffect(() => {
		setAllTracks(Array.isArray(tracks) ? tracks : []);
		setCanLoadMore(hasMore);
	}, [tracks, hasMore]);

	// Track fetcher state transitions to avoid running the append on every render.
	const wasFetchingRef = useRef(false);
	useEffect(() => {
		if (fetcher.state !== "idle") {
			wasFetchingRef.current = true;
			return;
		}
		if (!wasFetchingRef.current || !fetcher.data) return;
		wasFetchingRef.current = false;

		const isHot = location.pathname === HOT_TRACKS_LINK;
		const raw = fetcher.data.TRACKS;
		const newTracks: Track[] = isHot
			? ((raw as { tracks: Track[] }).tracks ?? [])
			: (raw as Track[]);

		if (Array.isArray(newTracks) && newTracks.length > 0) {
			setAllTracks((prev) => [...prev, ...newTracks]);
		}
		setCanLoadMore(fetcher.data.hasMore);
	}, [fetcher.state, fetcher.data, location.pathname]);

	const handleLoadMore = () => {
		const isHot = location.pathname === HOT_TRACKS_LINK;
		const lastTrackNo = allTracks.length - 1;
		const order = allTracks[lastTrackNo].order;
		const params = isHot
			? `?skip=${allTracks.length}`
			: order
				? `?after=${order}`
				: `?after=${allTracks[lastTrackNo]._id}`;
		fetcher.load(`${location.pathname}${params}`);
	};

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

import { useEffect, useRef, useState } from "react";
import { useFetcher, useLocation } from "react-router";
import type { Track } from "@/types/openwhyd-types";
import { HOT_TRACKS_LINK } from "@/types/playlists-types";

/**
 * Manages paginated track loading for a playlist page.
 *
 * Encapsulates:
 * - `useFetcher` for pagination requests
 * - Accumulated tracks state across pages
 * - `canLoadMore` flag
 * - Hot-playlist response-shape detection (`Track[]` vs `{ tracks: Track[] }`)
 * - `handleLoadMore` callback
 */
export function useTracksLoader(
	initialTracks: Track[],
	initialHasMore: boolean,
) {
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
		Array.isArray(initialTracks) ? initialTracks : [],
	);
	const [canLoadMore, setCanLoadMore] = useState(initialHasMore);

	// Reset accumulated tracks when the route's initial data changes (new navigation).
	useEffect(() => {
		setAllTracks(Array.isArray(initialTracks) ? initialTracks : []);
		setCanLoadMore(initialHasMore);
	}, [initialTracks, initialHasMore]);

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

	return {
		allTracks,
		canLoadMore,
		fetcher,
		handleLoadMore,
	};
}

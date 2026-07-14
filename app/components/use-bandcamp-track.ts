import { useEffect, useRef, useState } from "react";

export interface BandcampTrackData {
	streamUrl: string;
	duration: number;
	trackTitle: string;
	albumTitle: string;
	coverArt: string;
}

type FetchResponse = { error?: string } & Partial<BandcampTrackData>;

function parseBandcampUrl(url: string) {
	const match = url.match(
		/^https?:\/\/([^.]+)\.bandcamp\.com\/track\/([^/?#]+)/,
	);
	if (!match) return null;
	return { artist: match[1], track: match[2] };
}

/**
 * Fetches Bandcamp track metadata from the `/api/bandcamp-track` proxy route.
 *
 * Manages:
 * - `fetch('/api/bandcamp-track?...')` with AbortController + AbortSignal.timeout
 * - `trackData` state
 * - `isLoading` state
 * - Cleanup/abort on URL change or unmount
 *
 * Calls `onError` when the URL is invalid, the proxy is unavailable, or
 * the request times out, allowing the parent to skip to the next track.
 */
export function useBandcampTrack(
	url: string,
	onError?: (error: unknown) => void,
): { trackData: BandcampTrackData | null; isLoading: boolean } {
	const [trackData, setTrackData] = useState<BandcampTrackData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Store onError in a ref so the effect doesn't need it as a dependency.
	// Non-memoised parent callbacks would otherwise cause an unnecessary re-fetch.
	const onErrorRef = useRef(onError);
	onErrorRef.current = onError;

	useEffect(() => {
		const parsed = parseBandcampUrl(url);
		if (!parsed) {
			onErrorRef.current?.(new Error(`Invalid Bandcamp URL: ${url}`));
			return;
		}

		setTrackData(null);
		setIsLoading(true);

		const params = new URLSearchParams({
			artist: parsed.artist,
			track: parsed.track,
		});

		//Manual controller for unmounting/re-rendering
		const manualController = new AbortController();
		//Timeout signal
		const timeoutSignal = AbortSignal.timeout(4500);
		//The fetch will abort if EITHER signal triggers
		const combinedSignal = AbortSignal.any([
			manualController.signal,
			timeoutSignal,
		]);

		fetch(`/api/bandcamp-track?${params}`, { signal: combinedSignal })
			.then(async (res) => {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				return res.json();
			})
			.then((data: FetchResponse) => {
				if (manualController.signal.aborted) return;

				if (data.error) {
					console.error("BandcampPlayer: proxy error:", data.error);
					onErrorRef.current?.(new Error(data.error));
				} else {
					setTrackData(data as BandcampTrackData);
				}
				setIsLoading(false);
			})
			.catch((err: unknown) => {
				if (manualController.signal.aborted) return;

				if (err instanceof DOMException && err.name === "TimeoutError") {
					console.error("BandcampPlayer: track fetch timed out after 4.5s");
				} else {
					console.error("BandcampPlayer: fetch failed:", err);
				}

				setIsLoading(false);
				onErrorRef.current?.(err);
			});

		return () => {
			manualController.abort();
		};
	}, [url]); // only url — onError is stable via ref

	return { trackData, isLoading };
}

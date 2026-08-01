import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBandcampTrack } from "@/components/use-bandcamp-track";
import type { BandcampTrackData } from "@/types/bandcamp";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_URL = "https://someartist.bandcamp.com/track/some-track";
const INVALID_URL = "https://example.com/not-bandcamp";

const TRACK_DATA: BandcampTrackData = {
	streamUrl: "https://cdn.bandcamp.com/stream.mp3",
	duration: 180,
	trackTitle: "Some Track",
	albumTitle: "Some Album",
	coverArt: "https://cdn.bandcamp.com/cover.jpg",
};

function mockFetch(
	response: { ok: boolean; data?: unknown; status?: number } | Error,
) {
	if (response instanceof Error) {
		return vi.fn().mockRejectedValue(response);
	}
	return vi.fn().mockResolvedValue({
		ok: response.ok,
		status: response.status ?? (response.ok ? 200 : 500),
		json: () => Promise.resolve(response.data),
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
	vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("useBandcampTrack – invalid URL", () => {
	it("calls onError and does not fetch when the URL is not a Bandcamp track URL", async () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal("fetch", fetchSpy);
		const onError = vi.fn();

		renderHook(() => useBandcampTrack(INVALID_URL, onError));

		await waitFor(() => expect(onError).toHaveBeenCalledOnce());
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("keeps isLoading=true for an invalid URL (effect returns early)", async () => {
		vi.stubGlobal("fetch", vi.fn());
		const onError = vi.fn();

		const { result } = renderHook(() => useBandcampTrack(INVALID_URL, onError));

		// isLoading starts true and the effect never updates it for an invalid URL
		await waitFor(() => expect(onError).toHaveBeenCalled());
		expect(result.current.isLoading).toBe(true);
		expect(result.current.trackData).toBeNull();
	});
});

describe("useBandcampTrack – successful fetch", () => {
	it("sets trackData and isLoading=false when the proxy returns valid data", async () => {
		vi.stubGlobal("fetch", mockFetch({ ok: true, data: TRACK_DATA }));

		const { result } = renderHook(() => useBandcampTrack(VALID_URL));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.trackData).toEqual(TRACK_DATA);
	});

	it("starts with isLoading=true and trackData=null before the fetch resolves", () => {
		// Return a promise that never resolves to freeze the in-flight state
		vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

		const { result } = renderHook(() => useBandcampTrack(VALID_URL));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.trackData).toBeNull();
	});
});

describe("useBandcampTrack – proxy error in response body", () => {
	it("calls onError and sets isLoading=false when the response contains an error field", async () => {
		vi.stubGlobal(
			"fetch",
			mockFetch({ ok: true, data: { error: "Track not found" } }),
		);
		const onError = vi.fn();

		const { result } = renderHook(() => useBandcampTrack(VALID_URL, onError));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(onError).toHaveBeenCalledOnce();
		expect(result.current.trackData).toBeNull();
	});
});

describe("useBandcampTrack – HTTP error", () => {
	it("calls onError and sets isLoading=false on a non-200 response", async () => {
		vi.stubGlobal("fetch", mockFetch({ ok: false, status: 500 }));
		const onError = vi.fn();

		const { result } = renderHook(() => useBandcampTrack(VALID_URL, onError));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(onError).toHaveBeenCalledOnce();
		expect(result.current.trackData).toBeNull();
	});
});

describe("useBandcampTrack – network error", () => {
	it("calls onError and sets isLoading=false when fetch throws", async () => {
		vi.stubGlobal("fetch", mockFetch(new Error("Network failure")));
		const onError = vi.fn();

		const { result } = renderHook(() => useBandcampTrack(VALID_URL, onError));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(onError).toHaveBeenCalledOnce();
		expect(result.current.trackData).toBeNull();
	});
});

describe("useBandcampTrack – URL change resets state", () => {
	it("resets trackData to null when the URL prop changes", async () => {
		const SECOND_URL = "https://otheraptist.bandcamp.com/track/other-track";
		vi.stubGlobal("fetch", mockFetch({ ok: true, data: TRACK_DATA }));

		const { result, rerender } = renderHook(
			({ url }) => useBandcampTrack(url),
			{ initialProps: { url: VALID_URL } },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.trackData).toEqual(TRACK_DATA);

		// Switch to a URL that will never resolve
		vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
		rerender({ url: SECOND_URL });

		// trackData should be cleared immediately on URL change
		expect(result.current.trackData).toBeNull();
		expect(result.current.isLoading).toBe(true);
	});
});

import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/mocks/server";
import { useBandcampTrack } from "./use-bandcamp-track";

const VALID_URL = "https://someartist.bandcamp.com/track/some-track";
const INVALID_URL = "https://example.com/not-bandcamp";
const TRACK_DATA = {
	streamUrl: "https://cdn.bandcamp.com/stream.mp3",
	duration: 180,
	trackTitle: "Some Track",
	albumTitle: "Some Album",
	coverArt: "https://cdn.bandcamp.com/cover.jpg",
};

function respondWithTrack(data = TRACK_DATA) {
	server.use(
		http.get("*/api/bandcamp-track", ({ request }) => {
			const url = new URL(request.url);
			expect(url.searchParams.get("artist")).toBe("someartist");
			expect(url.searchParams.get("track")).toBe("some-track");
			return HttpResponse.json(data);
		}),
	);
}

describe("useBandcampTrack", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("requests encoded artist and track metadata, then exposes the playable track", async () => {
		respondWithTrack();

		const { result } = renderHook(() => useBandcampTrack(VALID_URL));

		expect(result.current).toEqual({ trackData: null, isLoading: true });
		await waitFor(() =>
			expect(result.current).toEqual({
				trackData: TRACK_DATA,
				isLoading: false,
			}),
		);
	});

	it("reports an invalid URL without making a proxy request", async () => {
		const onError = vi.fn();
		let proxyRequested = false;
		server.use(
			http.get("*/api/bandcamp-track", () => {
				proxyRequested = true;
				return HttpResponse.json(TRACK_DATA);
			}),
		);

		const { result } = renderHook(() => useBandcampTrack(INVALID_URL, onError));

		await waitFor(() => expect(onError).toHaveBeenCalledOnce());
		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({
				message: `Invalid Bandcamp URL: ${INVALID_URL}`,
			}),
		);
		expect(proxyRequested).toBe(false);
		expect(result.current.trackData).toBeNull();
	});

	it("clears loading and reports an HTTP failure from the proxy", async () => {
		server.use(
			http.get("*/api/bandcamp-track", () =>
				HttpResponse.json({ error: "Unavailable" }, { status: 500 }),
			),
		);
		const onError = vi.fn();

		const { result } = renderHook(() => useBandcampTrack(VALID_URL, onError));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.trackData).toBeNull();
		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({ message: "HTTP error! status: 500" }),
		);
	});

	it("clears loading and reports a structured proxy error", async () => {
		respondWithTrack({ error: "Track not found" });
		const onError = vi.fn();

		const { result } = renderHook(() => useBandcampTrack(VALID_URL, onError));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.trackData).toBeNull();
		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({ message: "Track not found" }),
		);
	});
});

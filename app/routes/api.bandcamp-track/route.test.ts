// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock bandcamp-fetch before importing the loader so the vi.mock hoisting works
vi.mock("bandcamp-fetch", () => ({
	default: {
		track: {
			getInfo: vi.fn(),
		},
	},
}));

// Mock the 500ms delay so tests run instantly
vi.mock("@/helpers/timeouts", () => ({
	timeout500: (r: (value: unknown) => void) => r(undefined),
}));

import bcFetch from "bandcamp-fetch";
import { loader } from "./route";

function makeRequest(params: Record<string, string>) {
	const url = new URL("http://localhost/api/bandcamp-track");
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}
	return new Request(url.toString());
}

const mockGetInfo = vi.mocked(
	(bcFetch as unknown as { track: { getInfo: ReturnType<typeof vi.fn> } }).track
		.getInfo,
);

beforeEach(() => {
	mockGetInfo.mockReset();
});

describe("loader – missing query parameters", () => {
	it("returns 400 when both artist and track are missing", async () => {
		const res = await loader({
			request: makeRequest({}),
			params: {},
			context: {},
		});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body).toHaveProperty("error");
	});

	it("returns 400 when only artist is provided", async () => {
		const res = await loader({
			request: makeRequest({ artist: "someartist" }),
			params: {},
			context: {},
		});
		expect(res.status).toBe(400);
	});

	it("returns 400 when only track is provided", async () => {
		const res = await loader({
			request: makeRequest({ track: "some-track" }),
			params: {},
			context: {},
		});
		expect(res.status).toBe(400);
	});
});

describe("loader – successful response", () => {
	it("returns 200 with track data when streamUrl is present", async () => {
		mockGetInfo.mockResolvedValue({
			streamUrl: "https://example.com/stream.mp3",
			duration: 180,
			name: "My Track",
			album: { name: "My Album" },
			imageUrl: "https://example.com/cover.jpg",
		});

		const res = await loader({
			request: makeRequest({ artist: "someartist", track: "some-track" }),
			params: {},
			context: {},
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({
			streamUrl: "https://example.com/stream.mp3",
			duration: 180,
			trackTitle: "My Track",
			albumTitle: "My Album",
			coverArt: "https://example.com/cover.jpg",
		});
	});

	it("uses 0 for duration and empty strings when optional fields are absent", async () => {
		mockGetInfo.mockResolvedValue({
			streamUrl: "https://example.com/stream.mp3",
			duration: undefined,
			name: "My Track",
			album: undefined,
			imageUrl: undefined,
		});

		const res = await loader({
			request: makeRequest({ artist: "someartist", track: "some-track" }),
			params: {},
			context: {},
		});

		const body = await res.json();
		expect(body.duration).toBe(0);
		expect(body.albumTitle).toBe("");
		expect(body.coverArt).toBe("");
	});
});

describe("loader – no stream URL", () => {
	it("returns 404 when streamUrl is null/undefined", async () => {
		mockGetInfo.mockResolvedValue({
			streamUrl: null,
			duration: 180,
			name: "My Track",
		});

		const res = await loader({
			request: makeRequest({ artist: "someartist", track: "some-track" }),
			params: {},
			context: {},
		});

		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body).toHaveProperty("error");
	});
});

describe("loader – bandcamp-fetch throws", () => {
	it("returns 500 with the error message", async () => {
		mockGetInfo.mockRejectedValue(new Error("Bandcamp unavailable"));

		const res = await loader({
			request: makeRequest({ artist: "someartist", track: "some-track" }),
			params: {},
			context: {},
		});

		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.error).toBe("Bandcamp unavailable");
	});

	it("returns 500 with 'Unknown error' when a non-Error is thrown", async () => {
		mockGetInfo.mockRejectedValue("string error");

		const res = await loader({
			request: makeRequest({ artist: "someartist", track: "some-track" }),
			params: {},
			context: {},
		});

		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.error).toBe("Unknown error");
	});
});

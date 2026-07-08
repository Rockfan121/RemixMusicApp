import { describe, expect, it } from "vitest";
import { getMusicServiceAndUrl, isBandcampUrl } from "@/helpers/media-url";

describe("getMusicServiceAndUrl", () => {
	it("converts a YouTube eId to a YouTube watch URL", () => {
		expect(getMusicServiceAndUrl("/yt/dQw4w9WgXcQ")).toBe(
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		);
	});

	it("converts a SoundCloud eId to a SoundCloud URL", () => {
		expect(getMusicServiceAndUrl("/sc/artist/track-slug")).toBe(
			"https://soundcloud.com/artist/track-slug",
		);
	});

	it("converts a DailyMotion eId to a DailyMotion video URL", () => {
		expect(getMusicServiceAndUrl("/dm/x7tgad0")).toBe(
			"https://www.dailymotion.com/video/x7tgad0",
		);
	});

	it("converts a Vimeo eId to a Vimeo URL", () => {
		expect(getMusicServiceAndUrl("/vi/123456789")).toBe(
			"https://vimeo.com/123456789",
		);
	});

	it("converts a Bandcamp eId to a Bandcamp track URL", () => {
		expect(getMusicServiceAndUrl("/bc/someartist/some-track")).toBe(
			"https://someartist.bandcamp.com/track/some-track",
		);
	});

	it("returns the raw id segment for a direct file eId", () => {
		expect(getMusicServiceAndUrl("/fi/https://example.com/audio.mp3")).toBe(
			"https://example.com/audio.mp3",
		);
	});

	it("returns the original eId for an unrecognised prefix", () => {
		const unknown = "/xx/someid";
		expect(getMusicServiceAndUrl(unknown)).toBe(unknown);
	});
});

describe("isBandcampUrl", () => {
	it("returns true for a valid Bandcamp track URL", () => {
		expect(
			isBandcampUrl("https://someartist.bandcamp.com/track/some-track"),
		).toBe(true);
	});

	it("returns false for a non-Bandcamp URL", () => {
		expect(isBandcampUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
			false,
		);
	});

	it("returns false for a Bandcamp album URL (not /track/)", () => {
		expect(
			isBandcampUrl("https://someartist.bandcamp.com/album/my-album"),
		).toBe(false);
	});
});

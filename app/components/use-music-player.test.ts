import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Track } from "@/types/openwhyd-types";

// Mocks must be declared before the module is imported so vitest can hoist them
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

// Make sleep resolve immediately so changeSong doesn't wait real time
vi.mock("@/helpers/timeouts", () => ({
	sleep: () => Promise.resolve(),
}));

import { toast } from "sonner";
import {
	DEFAULT_LOOP_MODE,
	WATCHDOG_THRESHOLD_MS,
	useMusicPlayer,
} from "./use-music-player";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTrack(id: string, eId = `/yt/${id}`): Track {
	return {
		_id: id,
		uId: "u1",
		uNm: "user1",
		text: "",
		name: `Track ${id}`,
		eId,
		ctx: "",
		pl: { id: 1, name: "Playlist" },
		img: "",
		repost: { pId: "", uId: "", uNm: "" },
		order: 0,
		lov: [],
		nbR: 0,
		nbP: 0,
	};
}

const TRACKS = [makeTrack("t1"), makeTrack("t2"), makeTrack("t3")];

function renderPlayer(
	overrides: {
		playlist?: Track[];
		firstTrackNo?: number;
		playRequestId?: number;
	} = {},
) {
	return renderHook(
		({ playlist, firstTrackNo, playRequestId }) =>
			useMusicPlayer({ playlist, firstTrackNo, playRequestId }),
		{
			initialProps: {
				playlist: TRACKS,
				firstTrackNo: 0,
				playRequestId: 1,
				...overrides,
			},
		},
	);
}

/**
 * Jump to a specific track by re-rendering with a new playRequestId.
 * The sync guard inside the hook resets currentSongIndex to firstTrackNo
 * whenever playRequestId changes.
 */
async function jumpTo(
	rerender: ReturnType<typeof renderPlayer>["rerender"],
	targetIndex: number,
	newRequestId = 2,
) {
	await act(() => {
		rerender({
			playlist: TRACKS,
			firstTrackNo: targetIndex,
			playRequestId: newRequestId,
		});
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useMusicPlayer – initial state", () => {
	it("always starts with currentSongIndex = 0", () => {
		// firstTrackNo only takes effect on subsequent playRequestId changes;
		// the very first render always starts at index 0.
		const { result } = renderPlayer({ firstTrackNo: 2 });
		expect(result.current.currentSongIndex).toBe(0);
	});

	it("currentTrack is the first track on initial render", () => {
		const { result } = renderPlayer();
		expect(result.current.currentTrack).toEqual(TRACKS[0]);
	});

	it("starts playing immediately when a non-empty playlist is provided", () => {
		const { result } = renderPlayer();
		expect(result.current.isPlaying).toBe(true);
	});
});

describe("useMusicPlayer – playRequestId", () => {
	it("resets currentSongIndex to firstTrackNo when playRequestId changes", async () => {
		const { result, rerender } = renderPlayer({
			firstTrackNo: 0,
			playRequestId: 1,
		});
		expect(result.current.currentSongIndex).toBe(0);

		// Re-render with a new playRequestId and a different firstTrackNo
		await jumpTo(rerender, 2, 2);
		expect(result.current.currentSongIndex).toBe(2);
	});
});

describe("useMusicPlayer – navigation", () => {
	it("nextSong advances to the next track", async () => {
		const { result } = renderPlayer({ firstTrackNo: 0 });
		await act(() => result.current.nextSong());
		expect(result.current.currentSongIndex).toBe(1);
	});

	it("nextSong wraps around from the last track to the first", async () => {
		const { result, rerender } = renderPlayer();
		await jumpTo(rerender, TRACKS.length - 1);
		await act(() => result.current.nextSong());
		expect(result.current.currentSongIndex).toBe(0);
	});

	it("prevSong goes back to the previous track", async () => {
		const { result, rerender } = renderPlayer();
		await jumpTo(rerender, 1);
		await act(() => result.current.prevSong());
		expect(result.current.currentSongIndex).toBe(0);
	});

	it("prevSong wraps around from the first track to the last", async () => {
		const { result } = renderPlayer({ firstTrackNo: 0 });
		await act(() => result.current.prevSong());
		expect(result.current.currentSongIndex).toBe(TRACKS.length - 1);
	});
});

describe("useMusicPlayer – toggles", () => {
	it("togglePlayPause flips isPlaying", () => {
		const { result } = renderPlayer();
		const initial = result.current.isPlaying;
		act(() => result.current.togglePlayPause());
		expect(result.current.isPlaying).toBe(!initial);
	});

	it("toggleMuted flips isMuted", () => {
		const { result } = renderPlayer();
		expect(result.current.isMuted).toBe(false);
		act(() => result.current.toggleMuted());
		expect(result.current.isMuted).toBe(true);
		act(() => result.current.toggleMuted());
		expect(result.current.isMuted).toBe(false);
	});

	it("toggleLooped cycles through all three modes and wraps back to the default", () => {
		const { result } = renderPlayer();
		// Verify the initial mode is the exported default
		expect(result.current.howLooped).toBe(DEFAULT_LOOP_MODE); // 1 = playlist loop
		act(() => result.current.toggleLooped());
		expect(result.current.howLooped).toBe(2); // track loop
		act(() => result.current.toggleLooped());
		expect(result.current.howLooped).toBe(0); // off
		act(() => result.current.toggleLooped());
		expect(result.current.howLooped).toBe(DEFAULT_LOOP_MODE); // back to start
	});
});

describe("useMusicPlayer – handleEnded", () => {
	it("advances to next song when not at the end", async () => {
		const { result } = renderPlayer({ firstTrackNo: 0 });
		await act(() => result.current.handleEnded());
		expect(result.current.currentSongIndex).toBe(1);
	});

	it("pauses (does not wrap) when at the last track and loop is off", async () => {
		const { result, rerender } = renderPlayer();
		// Jump to the last track
		await jumpTo(rerender, TRACKS.length - 1);

		// Disable loop: DEFAULT_LOOP_MODE is 1 (playlist), so toggle twice: 1→2→0
		act(() => result.current.toggleLooped()); // DEFAULT_LOOP_MODE→2
		act(() => result.current.toggleLooped()); // 2→0
		expect(result.current.howLooped).toBe(0);

		await act(() => result.current.handleEnded());
		// Should have paused, not wrapped
		expect(result.current.currentSongIndex).toBe(TRACKS.length - 1);
		expect(result.current.isPlaying).toBe(false);
	});

	it("wraps to first track when at the last track and loop is on", async () => {
		const { result, rerender } = renderPlayer();
		// Jump to the last track; howLooped starts at 1 (playlist loop)
		await jumpTo(rerender, TRACKS.length - 1);

		await act(() => result.current.handleEnded());
		expect(result.current.currentSongIndex).toBe(0);
	});
});

describe("useMusicPlayer – handleError", () => {
	beforeEach(() => {
		vi.mocked(toast.error).mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("shows a toast and advances to the next track past the broken one", async () => {
		const { result } = renderPlayer({ firstTrackNo: 0 });
		await act(() => result.current.handleError());

		expect(toast.error).toHaveBeenCalledOnce();
		// Track 0 is broken; the hook must advance to track 1
		expect(result.current.currentSongIndex).toBe(1);
	});

	it("does not advance when the playlist has only one track", async () => {
		const { result } = renderHook(() =>
			useMusicPlayer({
				playlist: [makeTrack("only")],
				firstTrackNo: 0,
				playRequestId: 1,
			}),
		);
		const indexBefore = result.current.currentSongIndex;
		await act(() => result.current.handleError());
		// Single-track playlist: full-loop guard fires, index unchanged
		expect(result.current.currentSongIndex).toBe(indexBefore);
	});
});

describe("useMusicPlayer – watchdog timer", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it(`auto-skips a stuck track after ${WATCHDOG_THRESHOLD_MS}ms of isPlaying with no progress`, async () => {
		vi.useFakeTimers();
		const { result } = renderPlayer({ firstTrackNo: 0 });

		// Simulate playback starting
		act(() => result.current.handlePlay());
		expect(result.current.isPlaying).toBe(true);

		// Advance past the watchdog threshold without any handleProgress call
		await act(async () => {
			vi.advanceTimersByTime(WATCHDOG_THRESHOLD_MS + 1_000);
		});

		// The watchdog should have triggered handleError, moving off track 0
		expect(result.current.currentSongIndex).toBe(1);
	});

	it("does not skip when progress events arrive within the watchdog threshold", async () => {
		vi.useFakeTimers();
		const { result } = renderPlayer({ firstTrackNo: 0 });

		act(() => result.current.handlePlay());

		// Simulate progress in two bursts — each well under WATCHDOG_THRESHOLD_MS
		const halfThreshold = Math.floor(WATCHDOG_THRESHOLD_MS / 2);
		await act(async () => {
			vi.advanceTimersByTime(halfThreshold);
		});
		act(() =>
			result.current.handleProgress({
				played: 0.1,
				loaded: 0.5,
				playedSeconds: halfThreshold / 1_000,
				loadedSeconds: halfThreshold / 500,
			}),
		);
		await act(async () => {
			vi.advanceTimersByTime(halfThreshold);
		});

		// Should still be on the same track
		expect(result.current.currentSongIndex).toBe(0);
	});
});

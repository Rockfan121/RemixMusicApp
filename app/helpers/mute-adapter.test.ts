import { describe, expect, it, vi } from "vitest";
import { createMuteAdapter } from "@/helpers/mute-adapter";

// ---------------------------------------------------------------------------
// null / non-object inputs
// ---------------------------------------------------------------------------

describe("createMuteAdapter – null / unrecognised inputs", () => {
	it("returns null for null", () => {
		expect(createMuteAdapter(null)).toBeNull();
	});

	it("returns null for undefined", () => {
		expect(createMuteAdapter(undefined)).toBeNull();
	});

	it("returns null for a string", () => {
		expect(createMuteAdapter("string")).toBeNull();
	});

	it("returns null for an empty object (no recognised API)", () => {
		expect(createMuteAdapter({})).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// YouTube IFrame API  (has `isMuted` function)
// ---------------------------------------------------------------------------

describe("createMuteAdapter – YouTube IFrame API", () => {
	function makeYTPlayer() {
		return { isMuted: vi.fn(), mute: vi.fn(), unMute: vi.fn() };
	}

	it("returns a non-null adapter", () => {
		expect(createMuteAdapter(makeYTPlayer())).not.toBeNull();
	});

	it("calls mute() when setMuted(true)", async () => {
		const player = makeYTPlayer();
		await createMuteAdapter(player)?.setMuted(true);
		expect(player.mute).toHaveBeenCalledOnce();
		expect(player.unMute).not.toHaveBeenCalled();
	});

	it("calls unMute() when setMuted(false)", async () => {
		const player = makeYTPlayer();
		await createMuteAdapter(player)?.setMuted(false);
		expect(player.unMute).toHaveBeenCalledOnce();
		expect(player.mute).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Vimeo Player SDK  (has `getMuted` + `setMuted` functions)
// ---------------------------------------------------------------------------

describe("createMuteAdapter – Vimeo Player SDK (no muteSyncSeqRef)", () => {
	function makeVimeoPlayer() {
		return {
			getMuted: vi.fn().mockResolvedValue(false),
			setMuted: vi.fn().mockResolvedValue(undefined),
		};
	}

	it("returns a non-null adapter", () => {
		expect(createMuteAdapter(makeVimeoPlayer())).not.toBeNull();
	});

	it("calls player.setMuted(true) once when no seqRef is provided", async () => {
		const player = makeVimeoPlayer();
		await createMuteAdapter(player)?.setMuted(true);
		expect(player.setMuted).toHaveBeenCalledOnce();
		expect(player.setMuted).toHaveBeenCalledWith(true);
	});

	it("calls player.setMuted(false) once when no seqRef is provided", async () => {
		const player = makeVimeoPlayer();
		await createMuteAdapter(player)?.setMuted(false);
		expect(player.setMuted).toHaveBeenCalledWith(false);
	});
});

describe("createMuteAdapter – Vimeo Player SDK (with muteSyncSeqRef, no race)", () => {
	it("calls player.setMuted once when the sequence number is not superseded", async () => {
		const player = {
			getMuted: vi.fn().mockResolvedValue(false),
			setMuted: vi.fn().mockResolvedValue(undefined),
		};
		const seqRef = { current: 0 };
		const adapter = createMuteAdapter(player, seqRef);
		await adapter?.setMuted(true);
		expect(player.setMuted).toHaveBeenCalledOnce();
		expect(player.setMuted).toHaveBeenCalledWith(true);
	});
});

describe("createMuteAdapter – Vimeo Player SDK (with muteSyncSeqRef, race condition)", () => {
	it("re-applies the value when a concurrent call bumps the sequence number mid-await", async () => {
		const player = {
			getMuted: vi.fn(),
			setMuted: vi.fn().mockResolvedValue(undefined),
		};
		const seqRef = { current: 0 };
		const adapter = createMuteAdapter(player, seqRef);

		// Start the first call – it increments seqRef.current to 1 synchronously
		// and then awaits player.setMuted (resolves in next microtask tick).
		const p1 = adapter?.setMuted(true);

		// Simulate a concurrent call by bumping the sequence number while p1 is
		// still awaiting its inner player.setMuted promise.
		seqRef.current++;

		await p1;

		// syncSeq (1) !== seqRef.current (2) → code re-calls setMuted(true)
		expect(player.setMuted).toHaveBeenCalledTimes(2);
		expect(player.setMuted).toHaveBeenNthCalledWith(1, true);
		expect(player.setMuted).toHaveBeenNthCalledWith(2, true);
	});
});

// ---------------------------------------------------------------------------
// SoundCloud Widget API  (has `setVolume` function)
// ---------------------------------------------------------------------------

describe("createMuteAdapter – SoundCloud Widget API", () => {
	function makeSCPlayer() {
		return { setVolume: vi.fn() };
	}

	it("returns a non-null adapter", () => {
		expect(createMuteAdapter(makeSCPlayer())).not.toBeNull();
	});

	it("calls setVolume(0) when setMuted(true)", async () => {
		const player = makeSCPlayer();
		await createMuteAdapter(player)?.setMuted(true);
		expect(player.setVolume).toHaveBeenCalledWith(0);
	});

	it("calls setVolume(100) when setMuted(false)", async () => {
		const player = makeSCPlayer();
		await createMuteAdapter(player)?.setMuted(false);
		expect(player.setVolume).toHaveBeenCalledWith(100);
	});
});

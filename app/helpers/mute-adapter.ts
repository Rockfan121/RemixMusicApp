/**
 * Platform-specific mute adapter interface.
 * Each adapter wraps a single SDK's mute API behind a uniform async interface.
 */
export interface MuteAdapter {
	setMuted(muted: boolean): Promise<void>;
}

/**
 * Creates the appropriate `MuteAdapter` for the given internal player object
 * returned by `ReactPlayer.getInternalPlayer()`.
 *
 * Supported SDKs:
 * - YouTube IFrame API (has `isMuted` function → `mute` / `unMute`)
 * - Vimeo Player SDK (has `getMuted` function → `setMuted`)
 * - SoundCloud Widget API (has `setVolume` function → volume-based mute)
 *
 * Returns `null` when the platform is not recognised or `internalPlayer` is
 * nullish, so callers can safely do `createMuteAdapter(player)?.setMuted(muted)`.
 */
export function createMuteAdapter(
	internalPlayer: unknown,
	muteSyncSeqRef?: { current: number },
): MuteAdapter | null {
	if (!internalPlayer || typeof internalPlayer !== "object") return null;

	const player = internalPlayer as Record<string, unknown>;

	if (typeof player.isMuted === "function") {
		// YouTube IFrame API
		return {
			async setMuted(muted: boolean) {
				if (muted) {
					(player.mute as () => void)();
				} else {
					(player.unMute as () => void)();
				}
			},
		};
	}

	if (
		typeof player.getMuted === "function" &&
		typeof player.setMuted === "function"
	) {
		// Vimeo Player SDK — setMuted is async; guard against rapid toggles
		return {
			async setMuted(muted: boolean) {
				if (!muteSyncSeqRef) {
					await (player.setMuted as (m: boolean) => Promise<void>)(muted);
					return;
				}
				const syncSeq = ++muteSyncSeqRef.current;
				await (player.setMuted as (m: boolean) => Promise<void>)(muted);
				if (syncSeq !== muteSyncSeqRef.current) {
					// A newer call superseded this one — apply its value instead
					await (player.setMuted as (m: boolean) => Promise<void>)(muted);
				}
			},
		};
	}

	if (typeof player.setVolume === "function") {
		// SoundCloud Widget API — no native mute, use volume as a proxy
		return {
			async setMuted(muted: boolean) {
				(player.setVolume as (v: number) => void)(muted ? 0 : 100);
			},
		};
	}

	return null;
}

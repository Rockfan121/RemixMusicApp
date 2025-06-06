import type { XPlaylist } from "@/types/myObjects";

const RECENT_PLAYLISTS_KEY = "recentPlaylists";
const MAX_RECENT_PLAYLISTS = 100;

/**
 * Adds a playlist to recent playlists in localStorage
 * If the playlist already exists, it will be moved to the front (most recent)
 * @param playlist The playlist to add
 */
export const addToRecentPlaylists = (playlist: XPlaylist): void => {
	try {
		// Get current playlists
		const recentPlaylists = getRecentPlaylists();

		// Remove the playlist if it already exists (to avoid duplicates)
		const filteredPlaylists = recentPlaylists.filter(
			(p) => p.url !== playlist.url,
		);

		// Add the new playlist to the beginning (most recent)
		filteredPlaylists.unshift(playlist);

		// Keep only the most recent MAX_PLAYLISTS
		const trimmedPlaylists = filteredPlaylists.slice(0, MAX_RECENT_PLAYLISTS);

		// Save back to localStorage
		localStorage.setItem(
			RECENT_PLAYLISTS_KEY,
			JSON.stringify(trimmedPlaylists),
		);
	} catch (error) {
		console.error("Failed to add playlist to recent playlists:", error);
	}
};

/**
 * Retrieves all recent playlists, ordered by most recent first
 * @returns Array of recent playlists
 */
export const getRecentPlaylists = (): XPlaylist[] => {
	try {
		const storedPlaylists = localStorage.getItem(RECENT_PLAYLISTS_KEY);
		return storedPlaylists ? JSON.parse(storedPlaylists) : [];
	} catch (error) {
		console.error("Error retrieving recent playlists:", error);
		return [];
	}
};

/**
 * Clears all recent playlists from localStorage
 * NOTE: It will be used later - for switching users, etc.
 */
const clearRecentPlaylists = (): void => {
	try {
		localStorage.removeItem(RECENT_PLAYLISTS_KEY);
	} catch (error) {
		console.error("Error clearing recent playlists:", error);
	}
};

/**
 * Checks if a playlist exists in recent playlists
 * NOTE: Probably it won't be used!
 * @param playlistId The ID of the playlist to check
 * @returns boolean indicating if the playlist exists
 */
const isInRecentPlaylists = (playlistId: string): boolean => {
	try {
		const recentPlaylists = getRecentPlaylists();
		return recentPlaylists.some((p) => p.url === playlistId);
	} catch (error) {
		console.error("Error checking recent playlists:", error);
		return false;
	}
};

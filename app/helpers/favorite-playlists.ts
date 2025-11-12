import type { ApiPlaylist } from "@/types/openwhyd-types";

// Constants
const FAVES_PLAYLISTS_KEY = "favoritePlaylists";

// Private state
let playlistsMap: Map<string, ApiPlaylist> | null = null;

/**
 * Initialize the Map from localStorage if not already initialized
 */
const initializeMap = (): Map<string, ApiPlaylist> => {
	if (playlistsMap === null) {
		try {
			const stored = localStorage.getItem(FAVES_PLAYLISTS_KEY);
			if (!stored) {
				playlistsMap = new Map<string, ApiPlaylist>();
			} else {
				// Convert stored array to Map
				const playlists = JSON.parse(stored) as ApiPlaylist[];
				playlistsMap = new Map(
					playlists.map((playlist) => [playlist.id, playlist]),
				);
			}
		} catch (error) {
			console.error("Failed to initialize favorites map:", error);
			playlistsMap = new Map<string, ApiPlaylist>();
		}
	}
	return playlistsMap;
};

/**
 * Save the Map back to localStorage
 */
const saveToStorage = (): void => {
	try {
		const playlists = Array.from(initializeMap().values());
		localStorage.setItem(FAVES_PLAYLISTS_KEY, JSON.stringify(playlists));
	} catch (error) {
		console.error("Failed to save favorites to storage:", error);
	}
};

/**
 * Adds a playlist to favorites
 * @param playlist The playlist to add
 * @returns boolean indicating if the operation was successful
 */
const addToFavorites = (playlist: ApiPlaylist): boolean => {
	try {
		const map = initializeMap();
		if (map.has(playlist.id)) {
			return false; // Already exists
		}

		map.set(playlist.id, playlist);
		saveToStorage();
		return true;
	} catch (error) {
		console.error("Failed to add playlist to favorites:", error);
		return false;
	}
};

/**
 * Removes a playlist from favorites
 * @param playlistId The ID of the playlist to remove
 * @returns boolean indicating if the operation was successful
 */
const removeFromFavorites = (playlistId: string): boolean => {
	try {
		const map = initializeMap();
		const deleted = map.delete(playlistId);
		if (deleted) {
			saveToStorage();
		}
		return deleted;
	} catch (error) {
		console.error("Failed to remove playlist from favorites:", error);
		return false;
	}
};

/**
 * Gets all favorite playlists
 * @returns Array of favorite playlists
 */
export const getFavoritePlaylists = (): ApiPlaylist[] => {
	const result = Array.from(initializeMap().values());
	return result.reverse();
};

/**
 * Checks if a playlist is in favorites
 * @param playlistId The ID of the playlist to check
 * @returns boolean indicating if the playlist is in favorites
 */
export const isPlaylistFavorite = (playlistId: string): boolean => {
	return initializeMap().has(playlistId);
};

/**
 * Toggles a playlist's favorite status
 * @param playlist The playlist to toggle
 * @returns boolean indicating new favorite status (true if added, false if removed)
 */
export const toggleFavorite = (playlist: ApiPlaylist): boolean => {
	if (isPlaylistFavorite(playlist.id)) {
		return !removeFromFavorites(playlist.id);
	}
	return addToFavorites(playlist);
};

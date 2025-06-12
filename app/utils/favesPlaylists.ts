import type { XPlaylist } from "@/types/myObjects";

// Constants
const FAVES_PLAYLISTS_KEY = "favoritePlaylists";

// Private state
let playlistsMap: Map<string, XPlaylist> | null = null;

/**
 * Initialize the Map from localStorage if not already initialized
 */
const initializeMap = (): Map<string, XPlaylist> => {
	if (playlistsMap === null) {
		try {
			const stored = localStorage.getItem(FAVES_PLAYLISTS_KEY);
			if (!stored) {
				playlistsMap = new Map<string, XPlaylist>();
			} else {
				// Convert stored array to Map
				const playlists = JSON.parse(stored) as XPlaylist[];
				playlistsMap = new Map(
					playlists.map((playlist) => [playlist.url, playlist]),
				);
			}
		} catch (error) {
			console.error("Failed to initialize favorites map:", error);
			playlistsMap = new Map<string, XPlaylist>();
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
const addToFavorites = (playlist: XPlaylist): boolean => {
	try {
		const map = initializeMap();
		if (map.has(playlist.url)) {
			return false; // Already exists
		}

		map.set(playlist.url, playlist);
		saveToStorage();
		return true;
	} catch (error) {
		console.error("Failed to add playlist to favorites:", error);
		return false;
	}
};

/**
 * Removes a playlist from favorites
 * @param playlistUrl The ID of the playlist to remove
 * @returns boolean indicating if the operation was successful
 */
const removeFromFavorites = (playlistUrl: string): boolean => {
	try {
		const map = initializeMap();
		const deleted = map.delete(playlistUrl);
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
export const getFavoritePlaylists = (): XPlaylist[] => {
	const result = Array.from(initializeMap().values());
	return result.reverse();
};

/**
 * Checks if a playlist is in favorites
 * @param playlistUrl The ID of the playlist to check
 * @returns boolean indicating if the playlist is in favorites
 */
export const isPlaylistFavorite = (playlistUrl: string): boolean => {
	return initializeMap().has(playlistUrl);
};

/**
 * Toggles a playlist's favorite status
 * @param playlist The playlist to toggle
 * @returns boolean indicating new favorite status (true if added, false if removed)
 */
export const toggleFavorite = (playlist: XPlaylist): boolean => {
	if (isPlaylistFavorite(playlist.url)) {
		return !removeFromFavorites(playlist.url);
	}
	return addToFavorites(playlist);
};

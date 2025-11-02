import { MAX_FETCHED_ITEMS, MAX_PLAYLISTS } from "@/config.shared";

export function apiPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
) {
	return `https://openwhyd.org/api/playlist/
		${userId}_${playlistId}`;
}

export function apiUser(userId: string | undefined) {
	return `https://openwhyd.org/api/user/${userId}`;
}

export function userListOfPlaylists(userId: string | undefined) {
	return `https://openwhyd.org/u/${userId}/playlists?format=json&limit=${MAX_PLAYLISTS}`;
}

export function userPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
) {
	return `https://openwhyd.org/u/${userId}/playlist/
			${playlistId}?format=json&limit=${MAX_FETCHED_ITEMS}`;
}

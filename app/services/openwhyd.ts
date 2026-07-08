import { MAX_FETCHED_ITEMS, MAX_PLAYLISTS } from "@/config.shared";

const BASE_URL = "https://openwhyd.org";

export function search(query: string | undefined) {
	return `${BASE_URL}/search?q=${query}&format=json`;
}

export function apiPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
) {
	return `${BASE_URL}/api/playlist/${userId}_${playlistId}`;
}

export function apiUser(userId: string | undefined) {
	return `${BASE_URL}/api/user/${userId}?countPosts=true&countLikes=true`;
}

export function userListOfPlaylists(userId: string | undefined) {
	return `${BASE_URL}/u/${userId}/playlists?format=json&limit=${MAX_PLAYLISTS}`;
}

export function userPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
	afterId?: string,
) {
	const base = `${BASE_URL}/u/${userId}/playlist/${playlistId}?format=json&limit=${MAX_FETCHED_ITEMS - 1}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

export function userImg(userId: string | undefined) {
	return `${BASE_URL}/img/user/${userId}`;
}

export function playlistImg(playlist_Id: string | undefined) {
	return `${BASE_URL}/img/playlist/${playlist_Id}`;
}

export function hotPlaylist(skip?: number) {
	const base = `${BASE_URL}/hot?format=json&limit=${MAX_FETCHED_ITEMS}`;
	return skip ? `${base}&skip=${skip}` : base;
}

export function allPlaylist(afterId?: string) {
	const base = `${BASE_URL}/all?format=json&limit=${MAX_FETCHED_ITEMS}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

export function userLikesPlaylist(
	userId: string | undefined,
	afterId?: string,
) {
	const base = `${BASE_URL}/u/${userId}/likes?format=json`;
	return afterId ? `${base}&after=${afterId}` : base;
}

export function userAllPlaylist(userId: string | undefined, afterId?: string) {
	const base = `${BASE_URL}/u/${userId}?format=json&limit=${MAX_FETCHED_ITEMS - 1}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

export function userStreamPlaylist(
	userId: string | undefined,
	afterId?: string,
) {
	const base = `${BASE_URL}/stream?id=${userId}&format=json&limit=${MAX_FETCHED_ITEMS}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

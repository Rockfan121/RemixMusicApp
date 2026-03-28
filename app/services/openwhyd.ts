import { MAX_FETCHED_ITEMS, MAX_PLAYLISTS } from "@/config.shared";

export function apiPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
) {
	return `https://openwhyd.org/api/playlist/
		${userId}_${playlistId}`;
}

export function apiUser(userId: string | undefined) {
	return `https://openwhyd.org/api/user/${userId}?countPosts=true&countLikes=true`;
}

export function userListOfPlaylists(userId: string | undefined) {
	return `https://openwhyd.org/u/${userId}/playlists?format=json&limit=${MAX_PLAYLISTS}`;
}

export function userPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
	afterId?: string,
) {
	const base = `https://openwhyd.org/u/${userId}/playlist/
			${playlistId}?format=json&limit=${MAX_FETCHED_ITEMS}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

export function userImg(userId: string | undefined) {
	return `https://openwhyd.org/img/user/${userId}`;
}

export function playlistImg(playlist_Id: string | undefined) {
	return `https://openwhyd.org/img/playlist/${playlist_Id}`;
}

export function hotPlaylist(skip?: number) {
	const base = `https://openwhyd.org/hot?format=json&limit=${MAX_FETCHED_ITEMS}`;
	return skip ? `${base}&skip=${skip}` : base;
}

export function allPlaylist(afterId?: string) {
	const base = `https://openwhyd.org/all?format=json&limit=${MAX_FETCHED_ITEMS}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

export function userLikesPlaylist(
	userId: string | undefined,
	afterId?: string,
) {
	const base = `https://openwhyd.org/u/${userId}/likes?format=json&limit=${MAX_FETCHED_ITEMS}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

export function userAllPlaylist(userId: string | undefined, afterId?: string) {
	const base = `https://openwhyd.org/u/${userId}?format=json&limit=${MAX_FETCHED_ITEMS}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

export function userStreamPlaylist(
	userId: string | undefined,
	afterId?: string,
) {
	const base = `https://openwhyd.org/stream?id=${userId}&format=json&limit=${MAX_FETCHED_ITEMS}`;
	return afterId ? `${base}&after=${afterId}` : base;
}

import { MAX_FETCHED_ITEMS, MAX_PLAYLISTS } from "@/config.shared";
import type { ApiPlaylist, Track, UserPlaylist } from "@/types/openwhyd-types";
import { PlaylistsIDs } from "@/types/playlists-types";

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

// ---------------------------------------------------------------------------
// Typed fetch wrappers
// Each function fetches from the Openwhyd API, checks the HTTP status, and
// returns a typed result. They throw on non-200 responses.
// ---------------------------------------------------------------------------

type UserInfo = {
	id: string;
	name: string;
	nbPosts: number;
	nbLikes: number;
};

/**
 * Fetches the hot-tracks playlist page.
 * Returns `{ tracks, hasMore }` where `tracks` is the flat array extracted
 * from the `{ tracks: [] }` envelope that Openwhyd returns for this endpoint.
 */
export async function fetchHotPlaylist(skip?: number): Promise<{
	tracks: Track[];
	hasMore: boolean;
	raw: { tracks?: Track[] };
}> {
	const res = await fetch(hotPlaylist(skip));
	if (!res.ok)
		throw new Error(`fetchHotPlaylist: HTTP ${res.status} ${res.statusText}`);
	const data = (await res.json()) as { tracks?: Track[] };
	const tracks = data?.tracks ?? [];
	return {
		tracks,
		hasMore: Array.isArray(tracks) && tracks.length === MAX_FETCHED_ITEMS,
		raw: data,
	};
}

/**
 * Fetches the global "all tracks" (recent) playlist.
 */
export async function fetchAllPlaylist(afterId?: string): Promise<{
	tracks: Track[];
	hasMore: boolean;
}> {
	const res = await fetch(allPlaylist(afterId));
	if (!res.ok)
		throw new Error(`fetchAllPlaylist: HTTP ${res.status} ${res.statusText}`);
	const tracks = (await res.json()) as Track[];
	return {
		tracks,
		hasMore: Array.isArray(tracks) && tracks.length === MAX_FETCHED_ITEMS,
	};
}

/**
 * Fetches a specific user playlist by userId + playlistId.
 * Returns `null` if the playlist is inaccessible (non-200 or redirect response).
 */
export async function fetchUserPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
	afterId?: string,
): Promise<{ tracks: Track[]; hasMore: boolean } | null> {
	const res = await fetch(userPlaylist(userId, playlistId, afterId));
	if (!res.ok) return null;
	// Openwhyd responds with an HTML "moved" page (starting with "m") when the
	// playlist does not exist or has been deleted, rather than a 404 status.
	const text = await res.text();
	if (text.startsWith("moved")) return null;
	const tracks = JSON.parse(text) as Track[];
	return {
		tracks,
		hasMore: Array.isArray(tracks) && tracks.length === MAX_FETCHED_ITEMS,
	};
}

/**
 * Fetches the /api/playlist/:userId_:playlistId metadata endpoint.
 * Returns null when the playlist does not exist (non-200).
 */
export async function fetchApiPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
): Promise<ApiPlaylist[] | null> {
	const res = await fetch(apiPlaylist(userId, playlistId));
	if (!res.ok) return null;
	return (await res.json()) as ApiPlaylist[];
}

/**
 * Fetches user info from /api/user/:userId.
 * Returns null when the user does not exist (non-200).
 */
export async function fetchUserInfo(
	userId: string | undefined,
): Promise<UserInfo | null> {
	const res = await fetch(apiUser(userId));
	if (!res.ok) return null;
	return (await res.json()) as UserInfo;
}

/**
 * Fetches one of the three user special playlists (all / likes / stream).
 * Constructs and returns the typed `ApiPlaylist` descriptor together with tracks.
 */
export async function fetchUserSpecialPlaylist(
	userId: string | undefined,
	type: "all" | "likes" | "stream",
	afterId?: string,
): Promise<{
	playlistInfo: ApiPlaylist;
	tracks: Track[];
	hasMore: boolean;
} | null> {
	const userInfo = await fetchUserInfo(userId);
	if (!userInfo) return null;

	let tracksRes: Response;
	let playlistIdConst: string;
	let nbTracks: number;
	let hasMoreLimit: number;

	if (type === "all") {
		tracksRes = await fetch(userAllPlaylist(userId, afterId));
		playlistIdConst = PlaylistsIDs.UserAll;
		nbTracks = userInfo.nbPosts;
		hasMoreLimit = MAX_FETCHED_ITEMS - 1;
	} else if (type === "likes") {
		tracksRes = await fetch(userLikesPlaylist(userId, afterId));
		playlistIdConst = PlaylistsIDs.UserLikes;
		nbTracks = userInfo.nbLikes;
		hasMoreLimit = 21;
	} else {
		tracksRes = await fetch(userStreamPlaylist(userId, afterId));
		playlistIdConst = PlaylistsIDs.UserStream;
		nbTracks = -1;
		hasMoreLimit = MAX_FETCHED_ITEMS;
	}

	const playlistInfo: ApiPlaylist = {
		id: playlistIdConst,
		name: playlistIdConst,
		uId: userInfo.id,
		uNm: userInfo.name,
		plId: "",
		nbTracks,
	};

	if (!tracksRes.ok) {
		return { playlistInfo, tracks: [], hasMore: false };
	}

	const tracks = (await tracksRes.json()) as Track[];
	return {
		playlistInfo,
		tracks,
		hasMore: Array.isArray(tracks) && tracks.length === hasMoreLimit,
	};
}

/**
 * Fetches the list of user playlists.
 * Returns null when the user does not exist (non-200).
 */
export async function fetchUserListOfPlaylists(
	userId: string | undefined,
): Promise<UserPlaylist[] | null> {
	const res = await fetch(userListOfPlaylists(userId));
	if (!res.ok) return null;
	return (await res.json()) as UserPlaylist[];
}

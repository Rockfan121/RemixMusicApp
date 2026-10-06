import {
	MAX_FETCHED_ITEMS,
	MAX_FETCHED_LIKED_ITEMS,
	MAX_PLAYLISTS,
} from "@/config.shared";
import type { ApiPlaylist, Track, UserPlaylist } from "@/types/openwhyd-types";
import { PlaylistsIDs, PlaylistsNames } from "@/types/playlists-types";

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

function throwErrorMessage(functionName: string, response: Response): never {
	throw new Error(
		`${functionName}: HTTP ${response.status} ${response.statusText}, ${response.url}`,
	);
}

export async function fetchHotPlaylist(skip?: number): Promise<{
	tracks: Track[];
	hasMore: boolean;
	raw: { tracks?: Track[] };
}> {
	const res = await fetch(hotPlaylist(skip));
	if (!res.ok) throwErrorMessage("fetchHotPlaylist", res);
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
	if (!res.ok) throwErrorMessage("fetchAllPlaylist", res);
	const tracks = (await res.json()) as Track[];
	return {
		tracks,
		hasMore: Array.isArray(tracks) && tracks.length === MAX_FETCHED_ITEMS,
	};
}

/**
 * Fetches a specific user playlist by userId + playlistId.
 * Throws an error if the playlist is inaccessible (non-200 or redirect response).
 */
export async function fetchUserPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
	afterId?: string,
): Promise<{ tracks: Track[]; hasMore: boolean }> {
	const res = await fetch(userPlaylist(userId, playlistId, afterId));
	if (!res.ok) throwErrorMessage("fetchUserPlaylist", res);
	// Openwhyd responds with a non-JSON redirect page when a playlist is
	// unavailable, rather than a 404 status.
	const text = await res.text();
	let tracks: Track[];
	try {
		tracks = JSON.parse(text) as Track[];
	} catch {
		throw new Error(`fetchUserPlaylist: JSON parsing has failed, ${res.url}`);
	}
	return {
		tracks,
		hasMore: Array.isArray(tracks) && tracks.length === MAX_FETCHED_ITEMS,
	};
}

/**
 * Fetches the /api/playlist/:userId_:playlistId metadata endpoint.
 * Throws an error when the playlist does not exist (non-200).
 */
export async function fetchApiPlaylist(
	userId: string | undefined,
	playlistId: string | undefined,
): Promise<ApiPlaylist[]> {
	const res = await fetch(apiPlaylist(userId, playlistId));
	if (!res.ok) throwErrorMessage("fetchApiPlaylist", res);
	return (await res.json()) as ApiPlaylist[];
}

/**
 * Fetches user info from /api/user/:userId.
 * Throws an error when the user does not exist (non-200).
 */
export async function fetchUserInfo(
	userId: string | undefined,
): Promise<UserInfo> {
	const res = await fetch(apiUser(userId));
	if (!res.ok) throwErrorMessage("fetchUserInfo", res);
	return (await res.json()) as UserInfo;
}

/**
 * Fetches one of the three user special playlists (all / likes / stream).
 * Constructs and returns the typed `ApiPlaylist` descriptor together with tracks.
 * Throws an error if fetchUserInfo fails.
 */
export async function fetchUserSpecialPlaylist(
	userId: string | undefined,
	type: "all" | "likes" | "stream",
	afterId?: string,
): Promise<{
	playlistInfo: ApiPlaylist;
	tracks: Track[];
	hasMore: boolean;
}> {
	const userInfo = await fetchUserInfo(userId);

	let tracksRes: Response;
	let playlistIdConst: string;
	let playlistName: string;
	let nbTracks: number;
	let hasMoreLimit: number;

	if (type === "all") {
		tracksRes = await fetch(userAllPlaylist(userId, afterId));
		playlistIdConst = PlaylistsIDs.UserAll;
		playlistName = PlaylistsNames.UserAll;
		nbTracks = userInfo.nbPosts;
		hasMoreLimit = MAX_FETCHED_ITEMS;
	} else if (type === "likes") {
		tracksRes = await fetch(userLikesPlaylist(userId, afterId));
		playlistIdConst = PlaylistsIDs.UserLikes;
		playlistName = PlaylistsNames.UserLikes;
		nbTracks = userInfo.nbLikes;
		hasMoreLimit = MAX_FETCHED_LIKED_ITEMS;
	} else {
		tracksRes = await fetch(userStreamPlaylist(userId, afterId));
		playlistIdConst = PlaylistsIDs.UserStream;
		playlistName = PlaylistsNames.UserStream;
		nbTracks = -1;
		hasMoreLimit = MAX_FETCHED_ITEMS;
	}

	const playlistInfo: ApiPlaylist = {
		id: playlistIdConst,
		name: playlistName,
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
 * Throws an error when the user does not exist (non-200).
 */
export async function fetchUserListOfPlaylists(
	userId: string | undefined,
): Promise<UserPlaylist[]> {
	const res = await fetch(userListOfPlaylists(userId));
	if (!res.ok) throwErrorMessage("fetchUserListOfPlaylists", res);
	return (await res.json()) as UserPlaylist[];
}

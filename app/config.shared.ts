export const APP_NAME = "RemixMusicApp";
export const DEFAULT_FAILURE_REDIRECT = "/";
export const DEFAULT_SUCCESS_REDIRECT = "/account";

// Maximum number of recent playlists to store in localStorage
export const MAX_RECENT_PLAYLISTS = 200;

// Maximum number of items to fetch from Openwhyd API once a time
export const MAX_FETCHED_ITEMS = 500;

export function title(pageTitle?: string) {
	if (!pageTitle) return APP_NAME;

	return `${pageTitle} | ${APP_NAME}`;
}

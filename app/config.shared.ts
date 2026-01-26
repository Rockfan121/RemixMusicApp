export const APP_NAME = "RemixMusicApp";
export const DEFAULT_FAILURE_REDIRECT = "/player/exploring"; // "/";
export const DEFAULT_SUCCESS_REDIRECT = "/player/exploring"; // "/account";

// Maximum number of recent playlists to store in localStorage
export const MAX_PLAYLISTS = 200;

// Maximum number of items to fetch from Openwhyd API once a time
export const MAX_FETCHED_ITEMS = 50;

export function title(pageTitle?: string) {
	if (!pageTitle) return APP_NAME;

	return `${pageTitle} | ${APP_NAME}`;
}

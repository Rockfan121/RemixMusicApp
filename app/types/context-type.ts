import type { Track } from "./openwhyd-types";
import type { XPlaylist } from "./xplaylist-type";

/**
 * Interface for passing callback to OutletContext
 * callback - fires MusicPlayer when user click a track e.g. in "tracks" route)
 * favesCallback - fires when user clicks on the "favorite" button in the tracks header
 */
export interface ContextType {
	callback: (a: Array<Track>, b: number, c: XPlaylist) => void;
	favesCallback: (a: XPlaylist) => void;
}

import type { ApiPlaylist } from "@/types/openwhyd-types";
import type { Track } from "./openwhyd-types";

/**
 * Interface for passing callback to OutletContext
 * callback - fires MusicPlayer when user click a track e.g. in "tracks" route)
 * favesCallback - fires when user clicks on the "favorite" button in the tracks header
 */
export interface ContextType {
	callback: (a: Array<Track>, b: number, c: ApiPlaylist) => void;
	favesCallback: (a: ApiPlaylist) => void;
}

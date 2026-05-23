import { createContext, useContext } from "react";
import type { ApiPlaylist, Track } from "./openwhyd-types";

/**
 * Interface for passing callback to  React context
 * callback - fires MusicPlayer when user click a track (e.g. in "tracks" route)
 */

interface PlayerContextType {
	callback: (a: Array<Track>, b: number, c: ApiPlaylist) => void;
	recentPl: ApiPlaylist[];
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayerContext() {
	const ctx = useContext(PlayerContext);
	if (!ctx)
		throw new Error("usePlayerContext must be used within PlayerProvider");
	return ctx;
}

export { PlayerContext };

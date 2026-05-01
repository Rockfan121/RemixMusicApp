import { useEffect, useState } from "react";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
} from "react-router";
import { Header } from "@/components/header";
import { MusicPlayer } from "@/components/music-player";
import {
	ThemeSwitcherSafeHTML,
	ThemeSwitcherScript,
} from "@/components/theme-switcher";
import { Toaster } from "@/components/ui/sonner";
import {
	getFavoritePlaylists,
	toggleFavorite,
} from "@/helpers/favorite-playlists";
import {
	addToRecentPlaylists,
	getRecentPlaylists,
} from "@/helpers/recent-playlists";
import { myUrl } from "@/types/apiplaylist-helpers";
import type { ApiPlaylist, Track } from "@/types/openwhyd-types";

import "./globals.css";
import { PlayerContext } from "./types/player-context";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<ThemeSwitcherSafeHTML lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				<ThemeSwitcherScript />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
				<Toaster
					closeButton={true}
					offset={{ bottom: "120px", right: "118px", left: "16px" }}
					mobileOffset={{ bottom: "120px" }}
				/>
			</body>
		</ThemeSwitcherSafeHTML>
	);
}

export default function Root() {
	const [playlist, setPlaylist] = useState<Array<Track>>([]);
	const [firstTrackNo, setFirstTrackNo] = useState<number>(0);
	const [timestamp, setTimestamp] = useState<number>(0);
	const [playlistUrl, setPlaylistUrl] = useState<string>("");
	const [recentPl, setRecentPl] = useState<ApiPlaylist[]>([]);
	const [favesPl, setFavesPl] = useState<ApiPlaylist[]>([]);

	const handleCallback = (a: Array<Track>, b: number, c: ApiPlaylist) => {
		setPlaylist(a);
		setFirstTrackNo(b);
		setTimestamp(Date.now());
		setPlaylistUrl(myUrl(c));

		addToRecentPlaylists(c);
		setRecentPl(getRecentPlaylists());
	};

	const handleFavesCallback = (a: ApiPlaylist) => {
		toggleFavorite(a);
		setFavesPl(getFavoritePlaylists());
	};

	useEffect(() => {
		setRecentPl(getRecentPlaylists());
		setFavesPl(getFavoritePlaylists());
	}, []);

	const contextValue = {
		callback: handleCallback,
		favesCallback: handleFavesCallback,
		recentPl,
		favesPl,
	};

	return (
		<PlayerContext.Provider value={contextValue}>
			<Header />
			<Outlet />
			<MusicPlayer
				playlist={playlist}
				firstTrackNo={firstTrackNo}
				timestamp={timestamp}
				playlistUrl={playlistUrl}
			/>
		</PlayerContext.Provider>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	let status = 500;
	let message = "An unexpected error occurred.";
	if (isRouteErrorResponse(error)) {
		status = error.status;
		switch (error.status) {
			case 404:
				message = "Page Not Found";
				break;
		}
	} else {
		console.error(error);
	}

	return (
		<div className="container prose py-8">
			<h1>{status}</h1>
			<p>{message}</p>
		</div>
	);
}

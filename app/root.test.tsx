import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { getRecentPlaylists } from "@/helpers/recent-playlists";
import type { ApiPlaylist, Track } from "@/types/openwhyd-types";
import { usePlayerContext } from "@/types/player-context";

vi.mock("@/components/header", () => ({
	Header: () => <header />,
}));

vi.mock("@/components/theme-switcher-button", () => ({
	ThemeSwitcherButton: () => null,
}));

vi.mock("@/components/ui/sonner", () => ({
	Toaster: () => null,
}));

vi.mock("@/components/music-player", () => ({
	MusicPlayer: ({
		playlist,
		firstTrackNo,
		playRequestId,
		playlistUrl,
	}: {
		playlist: Track[];
		firstTrackNo: number;
		playRequestId: number;
		playlistUrl: string;
	}) => (
		<output
			aria-label="Player request"
			data-first-track-no={firstTrackNo}
			data-play-request-id={playRequestId}
			data-playlist-url={playlistUrl}
			data-track-count={playlist.length}
		/>
	),
}));

import Root from "./root";

const PLAYLIST: ApiPlaylist = {
	id: "user_1",
	name: "Playlist",
	uId: "user",
	uNm: "Artist",
	plId: "1",
	nbTracks: 2,
};

const TRACKS: Track[] = [
	{
		_id: "one",
		uId: "user",
		uNm: "Artist",
		text: "",
		name: "Track one",
		eId: "/yt/one",
		ctx: "",
		pl: { id: 1, name: "Playlist" },
		img: "",
		repost: { pId: "", uId: "user", uNm: "Artist" },
		order: 2,
		lov: [],
		nbR: 0,
		nbP: 0,
	},
	{
		_id: "two",
		uId: "user",
		uNm: "Artist",
		text: "",
		name: "Track two",
		eId: "/yt/two",
		ctx: "",
		pl: { id: 1, name: "Playlist" },
		img: "",
		repost: { pId: "", uId: "user", uNm: "Artist" },
		order: 1,
		lov: [],
		nbR: 0,
		nbP: 0,
	},
];

function PlaybackStarter() {
	const { callback, recentPl } = usePlayerContext();

	return (
		<>
			<button type="button" onClick={() => callback(TRACKS, 1, PLAYLIST)}>
				Play selected track
			</button>
			<output aria-label="Recent playlist count">{recentPl.length}</output>
		</>
	);
}

describe("Root playback callback", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("starts the selected playlist, increments replay requests, and persists recent history", async () => {
		const user = userEvent.setup();
		const router = createMemoryRouter(
			[
				{
					path: "/",
					element: <Root />,
					children: [{ index: true, element: <PlaybackStarter /> }],
				},
			],
			{ initialEntries: ["/"] },
		);

		render(<RouterProvider router={router} />);

		const playerRequest = await screen.findByLabelText("Player request");
		expect(playerRequest).toHaveAttribute("data-play-request-id", "0");
		expect(screen.getByLabelText("Recent playlist count")).toHaveTextContent(
			"0",
		);

		await user.click(
			screen.getByRole("button", { name: "Play selected track" }),
		);

		await waitFor(() =>
			expect(playerRequest).toHaveAttribute("data-play-request-id", "1"),
		);
		expect(playerRequest).toHaveAttribute("data-first-track-no", "1");
		expect(playerRequest).toHaveAttribute(
			"data-playlist-url",
			"/tracks/user/1",
		);
		expect(playerRequest).toHaveAttribute("data-track-count", "2");
		expect(screen.getByLabelText("Recent playlist count")).toHaveTextContent(
			"1",
		);
		expect(getRecentPlaylists()).toEqual([PLAYLIST]);

		await user.click(
			screen.getByRole("button", { name: "Play selected track" }),
		);

		await waitFor(() =>
			expect(playerRequest).toHaveAttribute("data-play-request-id", "2"),
		);
		expect(getRecentPlaylists()).toEqual([PLAYLIST]);
	});
});

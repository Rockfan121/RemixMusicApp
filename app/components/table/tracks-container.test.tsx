import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { ApiPlaylist, Track } from "@/types/openwhyd-types";
import { PlayerContext } from "@/types/player-context";
import TracksContainer from "./tracks-container";

const playlistInfo: ApiPlaylist = {
	id: "user_1",
	name: "Late Night Selections",
	uId: "user",
	uNm: "DJ Example",
	plId: "1",
	nbTracks: 2,
};

function makeTrack(overrides: Partial<Track> = {}): Track {
	return {
		_id: "track-1",
		uId: "artist",
		uNm: "Artist Example",
		text: "",
		name: "First Track",
		eId: "/yt/first-track",
		ctx: "",
		pl: { id: 1, name: "Late Night Selections" },
		img: "https://example.com/cover.jpg",
		repost: { pId: "", uId: "artist", uNm: "Artist Example" },
		order: 7,
		lov: [],
		nbR: 0,
		nbP: 0,
		...overrides,
	};
}

describe("TracksContainer", () => {
	const playerCallback = vi.fn();

	beforeEach(() => {
		playerCallback.mockReset();
	});

	function renderTracksContainer({
		tracks,
		hasMore = false,
		loader,
	}: {
		tracks: Track[];
		hasMore?: boolean;
		loader?: (args: { request: Request }) => unknown;
	}) {
		const router = createMemoryRouter(
			[
				{
					path: "/tracks",
					loader,
					HydrateFallback: () => null,
					element: (
						<PlayerContext.Provider
							value={{ callback: playerCallback, recentPl: [] }}
						>
							<TracksContainer
								hasMore={hasMore}
								playlistInfo={playlistInfo}
								tracks={tracks}
							/>
						</PlayerContext.Provider>
					),
				},
			],
			{ initialEntries: ["/tracks"] },
		);

		render(<RouterProvider router={router} />);
		return router;
	}

	it("shows the playlist header and empty-state message when no tracks are available", async () => {
		renderTracksContainer({ tracks: [] });

		expect(
			await screen.findByRole("heading", { name: playlistInfo.name }),
		).toBeVisible();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"This playlist is empty",
		);
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /load more/i }),
		).not.toBeInTheDocument();
	});

	it("renders tracks and hands the selected track list to the player", async () => {
		const tracks = [
			makeTrack(),
			makeTrack({ _id: "track-2", name: "Second Track" }),
		];
		const user = userEvent.setup();
		renderTracksContainer({ tracks });

		expect(await screen.findByRole("table")).toBeVisible();
		expect(screen.getByText("First Track")).toBeVisible();
		expect(screen.getByText("Second Track")).toBeVisible();

		await user.click(screen.getAllByRole("button", { name: /play/i })[1]);

		expect(playerCallback).toHaveBeenCalledWith(tracks, 1, playlistInfo);
		expect(
			screen.queryByRole("button", { name: /load more/i }),
		).not.toBeInTheDocument();
	});

	it("loads the next page after the final track order and appends it to the table", async () => {
		const firstTrack = makeTrack({ order: 42 });
		const nextTrack = makeTrack({
			_id: "track-2",
			name: "Second Track",
			order: 41,
		});
		let requestedUrl: URL | undefined;
		let resolveNextPage:
			| ((value: { TRACKS: Track[]; hasMore: boolean }) => void)
			| undefined;
		const user = userEvent.setup();

		renderTracksContainer({
			tracks: [firstTrack],
			hasMore: true,
			loader: ({ request }) => {
				const url = new URL(request.url);
				if (!url.searchParams.has("after")) return null;
				requestedUrl = url;
				return new Promise((resolve) => {
					resolveNextPage = resolve;
				});
			},
		});

		const loadMoreButton = await screen.findByRole("button", {
			name: /load more/i,
		});
		await user.click(loadMoreButton);

		await waitFor(() => expect(resolveNextPage).toBeDefined());
		expect(requestedUrl?.searchParams.get("after")).toBe("42");
		expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();

		resolveNextPage?.({ TRACKS: [nextTrack], hasMore: false });

		expect(await screen.findByText("Second Track")).toBeVisible();
		await waitFor(() =>
			expect(
				screen.queryByRole("button", { name: /load more/i }),
			).not.toBeInTheDocument(),
		);
	});
});

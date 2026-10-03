import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { Track } from "@/types/openwhyd-types";

vi.mock("@/helpers/timeouts", () => ({
	sleep: () => Promise.resolve(),
}));

vi.mock("react-player", async () => {
	const React = await import("react");
	return {
		default: React.forwardRef(
			(
				props: { url: string; playing: boolean; muted: boolean },
				ref,
			) => {
				React.useImperativeHandle(ref, () => ({
					seekTo: vi.fn(),
					getInternalPlayer: () => null,
				}));
				return React.createElement("output", {
					"data-testid": "react-player",
					"data-muted": String(props.muted),
					"data-playing": String(props.playing),
					"data-url": props.url,
				});
			},
		),
	};
});

vi.mock("@/components/BandcampPlayer", () => ({
	BandcampPlayer: ({
		url,
		playing,
		muted,
	}: {
		url: string;
		playing: boolean;
		muted: boolean;
	}) => (
		<output
			data-testid="bandcamp-player"
			data-muted={String(muted)}
			data-playing={String(playing)}
			data-url={url}
		/>
	),
}));

import { MusicPlayer } from "./music-player";

function makeTrack(id: string, eId = `/yt/${id}`): Track {
	return {
		_id: id,
		uId: "user",
		uNm: "Artist",
		text: "",
		name: `Track ${id}`,
		eId,
		ctx: "",
		pl: { id: 1, name: "Playlist" },
		img: "",
		repost: { pId: "", uId: "user", uNm: "Artist" },
		order: 1,
		lov: [],
		nbR: 0,
		nbP: 0,
	};
}

function renderPlayer(playlist: Track[]) {
	return render(
		<MemoryRouter>
			<MusicPlayer
				playlist={playlist}
				firstTrackNo={0}
				playRequestId={1}
				playlistUrl="/tracks/user/1"
			/>
		</MemoryRouter>,
	);
}

describe("MusicPlayer", () => {
	it("plays a standard provider URL and updates playback controls for the selected track", async () => {
		const user = userEvent.setup();
		const tracks = [makeTrack("one"), makeTrack("two")];

		renderPlayer(tracks);

		const media = await screen.findByTestId("react-player");
		await waitFor(() => expect(media).toHaveAttribute("data-playing", "true"));
		expect(media).toHaveAttribute(
			"data-url",
			"https://www.youtube.com/watch?v=one",
		);
		expect(
			screen.getByRole("link", { name: "Track one" }),
		).toHaveAttribute("href", "/tracks/user/1");

		await user.click(screen.getByRole("button", { name: "Pause" }));
		expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
		expect(media).toHaveAttribute("data-playing", "false");

		await user.click(screen.getByRole("button", { name: "Play" }));
		expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Mute" }));
		expect(screen.getByRole("button", { name: "Unmute" })).toBeVisible();
		expect(media).toHaveAttribute("data-muted", "true");

		await user.click(screen.getByRole("button", { name: "Next track" }));
		await waitFor(() =>
			expect(
				screen.getByRole("link", { name: "Track two" }),
			).toBeVisible(),
		);
		expect(screen.getByTestId("react-player")).toHaveAttribute(
			"data-url",
			"https://www.youtube.com/watch?v=two",
		);

		fireEvent.change(screen.getByRole("slider", { name: "Playback position" }), {
			target: { value: "0.5" },
		});
		expect(screen.getByRole("slider", { name: "Playback position" })).toHaveValue(
			"0.5",
		);
	});

	it("selects BandcampPlayer rather than ReactPlayer for Bandcamp tracks", async () => {
		renderPlayer([
			makeTrack("bandcamp", "/bc/someartist/some-track"),
		]);

		const bandcampPlayer = await screen.findByTestId("bandcamp-player");
		expect(bandcampPlayer).toHaveAttribute(
			"data-url",
			"https://someartist.bandcamp.com/track/some-track",
		);
		expect(screen.queryByTestId("react-player")).not.toBeInTheDocument();
	});
});

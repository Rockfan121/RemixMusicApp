import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { createRef } from "react";
import { server } from "@/mocks/server";
import type { BandcampPlayerHandle } from "@/types/bandcamp";
import { BandcampPlayer } from "./BandcampPlayer";

const TRACK_URL = "https://someartist.bandcamp.com/track/some-track";
const TRACK_DATA = {
	streamUrl: "https://cdn.bandcamp.com/stream.mp3",
	duration: 200,
	trackTitle: "Some Track",
	albumTitle: "Some Album",
	coverArt: "https://cdn.bandcamp.com/cover.jpg",
};

function renderPlayer(
	overrides: Partial<React.ComponentProps<typeof BandcampPlayer>> = {},
) {
	const props = {
		url: TRACK_URL,
		playing: false,
		volume: 0.5,
		muted: false,
		...overrides,
	};
	return render(<BandcampPlayer {...props} />);
}

describe("BandcampPlayer", () => {
	beforeEach(() => {
		vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("loads proxy metadata, renders the cover, and forwards media lifecycle events", async () => {
		server.use(
			http.get("*/api/bandcamp-track", () => HttpResponse.json(TRACK_DATA)),
		);
		const onReady = vi.fn();
		const onPlay = vi.fn();
		const onPause = vi.fn();
		const onEnded = vi.fn();
		const onDuration = vi.fn();
		const onProgress = vi.fn();

		renderPlayer({
			onReady,
			onPlay,
			onPause,
			onEnded,
			onDuration,
			onProgress,
		});

		expect(screen.getByText("...")).toBeVisible();
		expect(await screen.findByAltText("Some Track")).toHaveAttribute(
			"src",
			TRACK_DATA.coverArt,
		);

		const audio = screen.getByTestId("bandcamp-audio") as HTMLAudioElement;
		expect(audio).toHaveAttribute("src", TRACK_DATA.streamUrl);
		Object.defineProperty(audio, "duration", {
			configurable: true,
			value: TRACK_DATA.duration,
		});
		Object.defineProperty(audio, "currentTime", {
			configurable: true,
			value: 50,
			writable: true,
		});

		fireEvent.canPlay(audio);
		fireEvent.play(audio);
		fireEvent.pause(audio);
		fireEvent.durationChange(audio);
		fireEvent.timeUpdate(audio);
		fireEvent.ended(audio);

		expect(onReady).toHaveBeenCalledOnce();
		expect(onPlay).toHaveBeenCalledOnce();
		expect(onPause).toHaveBeenCalledOnce();
		expect(onDuration).toHaveBeenCalledWith(TRACK_DATA.duration);
		expect(onProgress).toHaveBeenCalledWith({
			played: 0.25,
			loaded: 0,
			playedSeconds: 50,
			loadedSeconds: 0,
		});
		expect(onEnded).toHaveBeenCalledOnce();
	});

	it("honors playback props and exposes the imperative audio controls", async () => {
		server.use(
			http.get("*/api/bandcamp-track", () => HttpResponse.json(TRACK_DATA)),
		);
		const play = vi
			.spyOn(HTMLMediaElement.prototype, "play")
			.mockResolvedValue(undefined);
		const ref = createRef<BandcampPlayerHandle>();

		render(
			<BandcampPlayer
				ref={ref}
				url={TRACK_URL}
				playing={true}
				volume={0.25}
				muted={false}
			/>,
		);

		const audio = (await screen.findByTestId(
			"bandcamp-audio",
		)) as HTMLAudioElement;
		await waitFor(() => expect(play).toHaveBeenCalled());
		expect(audio.volume).toBe(0.25);
		expect(audio.muted).toBeFalsy();
		Object.defineProperty(audio, "duration", {
			configurable: true,
			value: TRACK_DATA.duration,
		});

		ref.current?.seekTo(0.5);
		ref.current?.setMuted(true);

		expect(audio.currentTime).toBe(100);
		expect(ref.current?.getMuted()).toBeTruthy();
	});

	it("reports proxy failure and removes the loading player surface", async () => {
		server.use(
			http.get("*/api/bandcamp-track", () =>
				HttpResponse.json({ error: "Unavailable" }, { status: 500 }),
			),
		);
		const onError = vi.fn();

		renderPlayer({ onError });

		await waitFor(() => expect(onError).toHaveBeenCalledOnce());
		expect(screen.queryByTestId("bandcamp-audio")).not.toBeInTheDocument();
		expect(screen.queryByAltText("Some Track")).not.toBeInTheDocument();
	});
});

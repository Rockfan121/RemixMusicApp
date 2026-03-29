import { Component, createRef } from "react";

const DAILYMOTION_REGEX =
	/^(?:(?:https?):)?(?:\/\/)?(?:www\.)?(?:(?:dailymotion\.com(?:\/embed)?\/video)|dai\.ly)\/([a-zA-Z0-9]+)(?:_[\w_-]+)?(?:[\w.#_-]+)?/;

interface DailymotionPlayerProps {
	url: string;
	playing: boolean;
	muted: boolean;
	volume: number | null;
	loop: boolean;
	controls: boolean;
	width: string | number;
	height: string | number;
	playbackRate: number;
	onReady: () => void;
	onPlay: () => void;
	onPause: () => void;
	onBuffer: () => void;
	onBufferEnd: () => void;
	onEnded: () => void;
	onError: (error: unknown) => void;
	onDuration: (duration: number) => void;
	onSeek: (time: number) => void;
	onProgress: (state: {
		played: number;
		playedSeconds: number;
		loaded: number;
		loadedSeconds: number;
	}) => void;
}

/**
 * Custom react-player player for Dailymotion using the new geo.dailymotion.com
 * iframe embed and its postMessage API (replaces the deprecated DM.player SDK).
 */
export class DailymotionPlayer extends Component<DailymotionPlayerProps> {
	static displayName = "DailymotionPlayer";

	static canPlay(url: string): boolean {
		return DAILYMOTION_REGEX.test(url);
	}

	private iframeRef = createRef<HTMLIFrameElement>();
	private duration = 0;
	private currentTime = 0;
	private secondsLoaded = 0;

	getVideoId(url: string): string | null {
		const match = url.match(DAILYMOTION_REGEX);
		return match ? match[1] : null;
	}

	componentDidMount() {
		window.addEventListener("message", this.handleMessage);
	}

	componentDidUpdate(prevProps: DailymotionPlayerProps) {
		if (prevProps.playing !== this.props.playing) {
			if (this.props.playing) {
				this.play();
			} else {
				this.pause();
			}
		}
		if (prevProps.muted !== this.props.muted) {
			if (this.props.muted) {
				this.mute();
			} else {
				this.unmute();
			}
		}
		if (prevProps.volume !== this.props.volume && this.props.volume !== null) {
			this.setVolume(this.props.volume);
		}
	}

	componentWillUnmount() {
		window.removeEventListener("message", this.handleMessage);
	}

	handleMessage = (event: MessageEvent) => {
		if (event.origin !== "https://geo.dailymotion.com") return;
		const iframe = this.iframeRef.current;
		if (!iframe || event.source !== iframe.contentWindow) return;

		const data = event.data as Record<string, unknown>;
		if (!data || typeof data.event !== "string") return;

		const {
			onReady,
			onPlay,
			onPause,
			onEnded,
			onBuffer,
			onBufferEnd,
			onError,
			onDuration,
			onSeek,
			onProgress,
		} = this.props;

		switch (data.event) {
			case "apiready":
				if (this.props.muted) {
					this.mute();
				} else if (this.props.volume !== null) {
					this.setVolume(this.props.volume);
				}
				if (this.props.playing) {
					this.play();
				}
				onReady();
				break;
			case "play":
				onPlay();
				break;
			case "pause":
				onPause();
				break;
			case "end":
				onEnded();
				break;
			case "waiting":
				onBuffer();
				break;
			case "playing":
				onBufferEnd();
				break;
			case "timeupdate":
				if (typeof data.videoCurrentTime === "number") {
					this.currentTime = data.videoCurrentTime;
					if (this.duration > 0) {
						onProgress({
							played: this.currentTime / this.duration,
							playedSeconds: this.currentTime,
							loaded: this.secondsLoaded / this.duration,
							loadedSeconds: this.secondsLoaded,
						});
					}
				}
				break;
			case "durationchange":
				if (typeof data.videoDuration === "number") {
					this.duration = data.videoDuration;
					onDuration(this.duration);
				}
				break;
			case "seeked":
				if (typeof data.videoCurrentTime === "number") {
					this.currentTime = data.videoCurrentTime;
					onSeek(this.currentTime);
				}
				break;
			case "progress":
				if (typeof data.videoBufferedTime === "number") {
					this.secondsLoaded = data.videoBufferedTime;
				}
				break;
			case "error":
				onError(data);
				break;
		}
	};

	sendCommand(command: Record<string, unknown>) {
		const iframe = this.iframeRef.current;
		if (iframe?.contentWindow) {
			iframe.contentWindow.postMessage(command, "https://geo.dailymotion.com");
		}
	}

	play() {
		this.sendCommand({ command: "play" });
	}

	pause() {
		this.sendCommand({ command: "pause" });
	}

	stop() {
		this.sendCommand({ command: "pause" });
	}

	seekTo(amount: number, type?: string) {
		const time = type === "fraction" ? amount * this.duration : amount;
		this.sendCommand({ command: "seek", time });
	}

	setVolume(fraction: number) {
		this.sendCommand({ command: "setVolume", volume: fraction });
	}

	mute() {
		this.sendCommand({ command: "setMuted", muted: true });
	}

	unmute() {
		this.sendCommand({ command: "setMuted", muted: false });
	}

	setPlaybackRate(_rate: number) {
		// Not supported by the Dailymotion postMessage API — safe no-op
	}

	getDuration() {
		return this.duration;
	}

	getCurrentTime() {
		return this.currentTime;
	}

	getSecondsLoaded() {
		return this.secondsLoaded;
	}

	render() {
		const videoId = this.getVideoId(this.props.url);
		if (!videoId) return null;

		const src = `https://geo.dailymotion.com/player.html?video=${videoId}`;
		const { width, height } = this.props;

		return (
			<iframe
				ref={this.iframeRef}
				src={src}
				width={width}
				height={height}
				allow="autoplay"
				allowFullScreen
				title="Dailymotion Player"
				style={{ border: 0 }}
			/>
		);
	}
}

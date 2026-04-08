import bcFetch from "bandcamp-fetch";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const artist = url.searchParams.get("artist");
	const track = url.searchParams.get("track");

	if (!artist || !track) {
		return Response.json(
			{ error: "Missing required query parameters: artist, track" },
			{ status: 400 },
		);
	}

	const trackUrl = `https://${artist}.bandcamp.com/track/${track}`;

	try {
		const trackInfo = await bcFetch.track.getInfo({ trackUrl });

		if (!trackInfo.streamUrl) {
			return Response.json(
				{ error: "No stream URL available for this track" },
				{ status: 404, headers: { "Cache-Control": "no-store" } },
			);
		}

		return Response.json(
			{
				streamUrl: trackInfo.streamUrl,
				duration: trackInfo.duration ?? 0,
				trackTitle: trackInfo.name,
				albumTitle: trackInfo.album?.name ?? "",
				coverArt: trackInfo.imageUrl ?? "",
			},
			{ headers: { "Cache-Control": "public, max-age=3600" } },
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return Response.json(
			{ error: message },
			{ status: 500, headers: { "Cache-Control": "no-store" } },
		);
	}
}

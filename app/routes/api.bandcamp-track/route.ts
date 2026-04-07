import type { LoaderFunctionArgs } from "react-router";

const BC_API_ROOT = "https://bc.wemakesites.net/api";

async function bcPost(
	endpoint: string,
	apiKey: string,
	body: Record<string, unknown>,
) {
	const res = await fetch(`${BC_API_ROOT}/${endpoint}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Api-Key": apiKey,
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		throw new Error(`BC API ${endpoint} responded with ${res.status}`);
	}
	const json = (await res.json()) as {
		code: number;
		message: string;
		data: unknown;
	};
	if (json.code !== 0) {
		throw new Error(`BC API ${endpoint} error: ${json.message}`);
	}
	return json.data;
}

interface TrackData {
	album?: { slug?: string };
	title?: string;
	art?: string;
	embed?: string;
	artistSlug?: string;
}

interface AlbumEmbedParam {
	album?: string;
	[key: string]: string | undefined;
}

interface AlbumData {
	title?: string;
	embedParams?: AlbumEmbedParam[];
}

interface PlayerTrack {
	title?: string;
	title_link?: string;
	duration?: number;
	file?: { "mp3-128"?: string };
	art?: string;
}

interface PlayerData {
	tracks?: PlayerTrack[];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
	const { BANDCAMP_API_KEY } = context;

	if (!BANDCAMP_API_KEY) {
		return Response.json(
			{ error: "BANDCAMP_API_KEY is not configured" },
			{
				status: 503,
				headers: { "Cache-Control": "no-store" },
			},
		);
	}

	const url = new URL(request.url);
	const artist = url.searchParams.get("artist");
	const track = url.searchParams.get("track");

	if (!artist || !track) {
		return Response.json(
			{ error: "Missing required query parameters: artist, track" },
			{ status: 400 },
		);
	}

	try {
		// Step 1: get track info (includes album slug, cover art, embed URL)
		const trackData = (await bcPost("track", BANDCAMP_API_KEY, {
			artist,
			track,
		})) as TrackData;

		const albumSlug = trackData.album?.slug;
		const trackTitle = trackData.title ?? track;
		const coverArt = trackData.art ?? "";
		const embedUrl = trackData.embed ?? "";

		if (!albumSlug) {
			return Response.json(
				{ error: "Album slug not found in track data" },
				{ status: 404, headers: { "Cache-Control": "no-store" } },
			);
		}

		// Step 2: get album info (includes numeric album ID in embedParams)
		const albumData = (await bcPost("album", BANDCAMP_API_KEY, {
			artist,
			album: albumSlug,
		})) as AlbumData;

		const albumTitle = albumData.title ?? "";
		const albumIdParam = albumData.embedParams?.find(
			(p) => p.album !== undefined,
		);
		const albumId = albumIdParam?.album ? Number(albumIdParam.album) : null;

		if (!albumId) {
			return Response.json(
				{ error: "Numeric album ID not found in album data" },
				{ status: 404, headers: { "Cache-Control": "no-store" } },
			);
		}

		// Step 3: get player data (streaming URLs for all tracks in the album)
		const playerData = (await bcPost("player", BANDCAMP_API_KEY, {
			album: albumId,
		})) as PlayerData;

		const tracks = playerData.tracks ?? [];

		// Find the requested track by matching its slug in the title_link
		const targetTrack = tracks.find((t) =>
			t.title_link?.endsWith(`/track/${track}`),
		);

		if (!targetTrack) {
			return Response.json(
				{ error: "Track not found in player data" },
				{ status: 404, headers: { "Cache-Control": "no-store" } },
			);
		}

		const rawStreamUrl = targetTrack.file?.["mp3-128"];
		if (!rawStreamUrl) {
			return Response.json(
				{ error: "No stream URL available for this track" },
				{ status: 404, headers: { "Cache-Control": "no-store" } },
			);
		}

		// The BC API returns HTML-encoded ampersands in the stream URL query string
		const streamUrl = rawStreamUrl.replace(/&amp;/g, "&");

		return Response.json(
			{
				streamUrl,
				duration: targetTrack.duration ?? 0,
				trackTitle: targetTrack.title ?? trackTitle,
				albumTitle,
				coverArt: targetTrack.art ?? coverArt,
				embedUrl,
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

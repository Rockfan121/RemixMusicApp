import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import ScrollToTop from "react-scroll-to-top";
import CaptionedImage from "@/components/captioned-image";
import { Separator } from "@/components/ui/separator";
import { title } from "@/config.shared";
import { imgUrl } from "@/helpers/apiplaylist-helpers";
import { timeout300 } from "@/helpers/timeouts";
import { search, userImg } from "@/services/openwhyd";
import type {
	SearchedPlaylist,
	SearchedUser,
	Track,
} from "@/types/openwhyd-types";

const PAGE_TITLE = "Search";

export const loader = async ({ params }: LoaderFunctionArgs) => {
	await new Promise(timeout300);

	const QUERY = params.query;
	const search_res = await fetch(search(QUERY));

	if (search_res.status !== 200) {
		return {
			response: {},
			query: QUERY,
		};
	}

	return {
		response: await search_res.json(),
		query: QUERY,
	};
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function Exploring() {
	const { response, query } = useLoaderData<typeof loader>();

	const results = response.results;
	let playlists = [] as SearchedPlaylist[];
	let tracks = [] as Track[];
	let users = [] as SearchedUser[];

	if (results) {
		playlists = results.playlists;
		tracks = results.posts;
		users = results.users;
	}
	//return <div/>;

	const uniquePlaylists = playlists.filter(
		(value, index, self) => index === self.findIndex((p) => p.id === value.id),
	);

	const mappedPlaylists = uniquePlaylists.map((p) =>
		p ? (
			<CaptionedImage
				title={p.name}
				subtitle=""
				coverImg={imgUrl(p.id)}
				trackCount={p.nbTracks}
				url={`/tracks/${p.idParts[0]}/${p.idParts[1]}`}
				key={p.id}
			/>
		) : null,
	);

	const mappedUsers = users.map((u) =>
		u ? (
			<CaptionedImage
				title={u.name}
				subtitle=""
				coverImg={userImg(u._id)}
				url={`/user?q=${u._id}`}
				key={u._id}
			/>
		) : null,
	);

	const mappedTracks = tracks.map((t) =>
		t ? (
			<CaptionedImage
				title={t.name}
				subtitle={t.uNm}
				coverImg={t.img}
				url={`/tracks/${t.uId}/${t.pl?.id}`}
				key={t._id}
			/>
		) : null,
	);

	return (
		<div className="mx-6 my-4">
			<h4>
				Search for{" "}
				<span className="text-accent-foreground italic">{` ${query}`}</span>
			</h4>

			<h5>Playlists</h5>
			<div className="grid-with-images">{mappedPlaylists}</div>
			<Separator />
			<h5>Tracks</h5>
			<div className="grid-with-images">{mappedTracks}</div>
			<Separator />
			<h5>Users</h5>
			<div className="grid-with-images">{mappedUsers}</div>
			<ScrollToTop smooth className="to-top-button" />
		</div>
	);
}

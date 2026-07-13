import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import ScrollToTop from "react-scroll-to-top";
import CaptionedImage from "@/components/captioned-image";
import { Separator } from "@/components/ui/separator";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { search, userImg } from "@/services/openwhyd";
import { imgUrl } from "@/types/apiplaylist-helpers";
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
			<Link to={`/tracks/${p.idParts[0]}/${p.idParts[1]}`} key={p.id}>
				<CaptionedImage
					title={p.name}
					subtitle=""
					coverImg={imgUrl(p.id)}
					trackCount={p.nbTracks}
				/>
			</Link>
		) : null,
	);

	const mappedUsers = users.map((u) =>
		u ? (
			<Link to={`/user?q=${u._id}`} key={u._id}>
				<CaptionedImage title={u.name} subtitle="" coverImg={userImg(u._id)} />
			</Link>
		) : null,
	);

	const mappedTracks = tracks.map((t) =>
		t ? (
			<Link to={`/tracks/${t.uId}/${t.pl?.id}`} key={t._id}>
				<CaptionedImage title={t.name} subtitle={t.uNm} coverImg={t.img} />
			</Link>
		) : null,
	);

	return (
		<div className="space-x-5 mx-6 mb-4">
			<h4 className="mx-4 text-lg sm:text-xl font-bold text-ring">
				{`Search for ${query}`}
			</h4>

			<h5 className="m-4 mt-6 text-md sm:text-lg font-bold text-ring italic">
				Playlists
			</h5>
			<div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 m-6">
				{mappedPlaylists}
			</div>
			<Separator />
			<h5 className="m-4 mt-6 text-md sm:text-lg font-bold text-ring italic">
				Tracks
			</h5>
			<div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 m-6">
				{mappedTracks}
			</div>
			<Separator />
			<h5 className="m-4 mt-6 text-md sm:text-lg font-bold text-ring italic">
				Users
			</h5>
			<div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 m-6">
				{mappedUsers}
			</div>
			<ScrollToTop smooth className="to-top-button" />
		</div>
	);
}

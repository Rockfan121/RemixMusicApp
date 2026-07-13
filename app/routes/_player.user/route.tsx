import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import PlaylistsList from "@/components/playlists";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { apiUser } from "@/services/openwhyd";

const PAGE_TITLE = "Explore playlists";

/**
 * Loader of "user" route checks if there is the "q" param in URL. The param is supposed to be user id of some Openwhyd user.
 * If the param is actually given, the loader will fetch that user's playlists.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const USER_ID = url.searchParams.get("q");

	if (USER_ID !== null && USER_ID !== "") {
		await new Promise(timeout300);
		const res = await fetch(apiUser(USER_ID));

		const resJson = await res.json();
		if (typeof resJson !== "undefined" && !Object.hasOwn(resJson, "error")) {
			return {
				userRes: await resJson,
				query: USER_ID,
			};
		}
	}
	return {
		userRes: {},
		query: USER_ID,
	};
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function Exploring() {
	const { userRes, query } = useLoaderData<typeof loader>();
	let userNameRes = "";
	let userIdRes = "";
	let noOfPosts = -1;
	let noOfLikes = -1;
	if (Object.keys(userRes).length) {
		userNameRes = userRes.name;
		userIdRes = userRes.id;
		noOfPosts = userRes.nbPosts;
		noOfLikes = userRes.nbLikes;
	}

	return (
		<>
			<PlaylistsList
				listIntro={userNameRes ? `Playlists by ${userNameRes}` : PAGE_TITLE}
				listEmptyText="The user you looked for doesn't exist... But you can listen to some other tracks - click some playlist below!"
				userName={userNameRes}
				userId={userIdRes}
				noOfLikes={noOfLikes}
				noOfPosts={noOfPosts}
			>
				{userRes.pl}
			</PlaylistsList>
		</>
	);
}

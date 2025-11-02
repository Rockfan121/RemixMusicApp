import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Form, useLoaderData } from "react-router";
import PlaylistsList from "@/components/playlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { title } from "@/config.shared";
import { timeout300 } from "@/helpers/timeouts";
import { apiUser, userListOfPlaylists } from "@/services/openwhyd";

const PAGE_TITLE = "Explore playlists";

/**
 * Loader of "exploring" route checks if there is the "q" param in URL. The param is supposed to be user id of some Openwhyd user.
 * If the param is actually given, the loader will fetch that user's playlists.
 * As the response doesn't include userName (which is necessary for displaying the playlists), the loader then fetches some playlist data.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const USER_ID = url.searchParams.get("q");

	if (USER_ID !== null && USER_ID !== "") {
		await new Promise(timeout300);
		const res = await fetch(userListOfPlaylists(USER_ID));

		const resJson = await res.json();
		if (typeof resJson !== "undefined" && !Object.hasOwn(resJson, "error")) {
			await new Promise(timeout300);
			const userNameRes = await fetch(apiUser(USER_ID));

			return {
				res: await resJson,
				userRes: await userNameRes.json(),
				query: USER_ID,
			};
		}
	}
	return {
		res: {},
		userRes: {},
		query: USER_ID,
	};
};

export const meta: MetaFunction = () => {
	return [{ title: title(PAGE_TITLE) }];
};

export default function Exploring() {
	const { res, userRes, query } = useLoaderData<typeof loader>();
	let userNameRes = "";
	let userIdRes = "";
	if (Object.keys(userRes).length) {
		userNameRes = userRes.name;
		userIdRes = userRes.id;
	}

	useEffect(() => {
		const searchField = document.getElementById("query");
		if (searchField instanceof HTMLInputElement) {
			searchField.value = query || "";
		}
	}, [query]);

	return (
		<>
			<search>
				<Form id="search-form">
					<div className="flex mx-6 mb-10 w-60 max-w-sm items-center space-x-1">
						<Input
							defaultValue={query || ""}
							id="query"
							name="q"
							placeholder="Openwhyd userId"
							type="search"
							pattern="\w+"
						/>
						<Button type="submit" size="icon">
							<PaperPlaneIcon />
						</Button>
					</div>
				</Form>
			</search>
			<PlaylistsList
				listIntro={PAGE_TITLE}
				listEmptyText="Enter correct userId of one of Openwhyd users and click the button to view all their playlists"
				userName={userNameRes}
				userId={userIdRes}
			>
				{res}
			</PlaylistsList>
		</>
	);
}

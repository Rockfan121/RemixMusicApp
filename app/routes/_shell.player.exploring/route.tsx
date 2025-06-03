import { Button } from "@/components/ui/button";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

import type { LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";

import PlaylistsList from "@/components/playlists";
import { Input } from "@/components/ui/input";

/**
 * Loader of "exploring" route checks if there is the "q" param in URL. The param is supposed to be user id of some Openwhyd user.
 * If the param is actually given, the loader will fetch that user's playlists.
 * As the response doesn't include userName (which is necessary for displaying the playlists), the loader then fetches some playlist data.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const USER_ID = url.searchParams.get("q");

	if (USER_ID !== null && USER_ID !== "") {
		await new Promise((r) => setTimeout(r, 300));
		const res = await fetch(
			`https://openwhyd.org/u/${USER_ID}/playlists?format=json&limit=100`,
		);

		const resJson = await res.json();
		if (typeof resJson !== "undefined" && !Object.hasOwn(resJson, "error")) {
			const firstPlaylistId = (await resJson)[0].id;
			await new Promise((r) => setTimeout(r, 300));
			const userNameRes = await fetch(
				`https://openwhyd.org/u/${USER_ID}/playlist/${firstPlaylistId}?format=json&limit=1`,
			);

			return {
				res: await resJson,
				firstPlaylistRes: await userNameRes.json(),
			};
		}
	}
	return {
		res: {},
		firstPlaylistRes: {},
	};
};

export default function Exploring() {
	const { res, firstPlaylistRes } = useLoaderData<typeof loader>();
	let userNameRes = "";
	let userIdRes = "";
	if (Object.keys(firstPlaylistRes).length) {
		userNameRes = firstPlaylistRes[0].uNm;
		userIdRes = firstPlaylistRes[0].uId;
	}

	return (
		<>
			<search>
				<Form id="search-form">
					<div className="flex mx-6 mb-10 w-60 max-w-sm items-center space-x-1">
						<Input
							id="q"
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
				listIntro="Explore playlists"
				listEmptyText="Enter correct userId of one of Openwhyd users and click the button to view all their playlists"
				userName={userNameRes}
				userId={userIdRes}
			>
				{res}
			</PlaylistsList>
		</>
	);
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import PlaylistsList from "@/components/playlists";

const USER_ID = "669b02cc904a229c1a956b3b";

export async function loader() {
	const res = await fetch(
		`https://openwhyd.org/u/${USER_ID}/playlists?format=json&limit=100`,
	);

	const resJson = await res.json();
	const firstPlaylistId = (await resJson)[0].id;

	const userNameRes = await fetch(
		`https://openwhyd.org/u/${USER_ID}/playlist/${firstPlaylistId}?format=json&limit=100`,
	);

	return json({
		res: await resJson,
		userNameRes: await userNameRes.json(),
	});
}

export default function Exploring() {
	const { res, userNameRes } = useLoaderData<typeof loader>();

	return (
		<>
			<div className="flex space-x-5 mx-6 mb-10">
				<div className="flex w-60 max-w-sm items-center space-x-1">
					<Input placeholder="Openwhyd userId" type="search" />
					<Button type="submit" size="icon">
						<PaperPlaneIcon />
					</Button>
				</div>
				<div className="flex w-60 max-w-sm items-center space-x-1">
					<Input placeholder="Openwhyd userName" type="search" />
					<Button type="submit" size="icon">
						<PaperPlaneIcon />
					</Button>
				</div>
			</div>
			<PlaylistsList
				listIntro="Explore playlists"
				userName={userNameRes[0].uNm}
				userId={USER_ID}
			>
				{res}
			</PlaylistsList>
		</>
	);
}

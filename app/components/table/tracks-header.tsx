import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { imgUrl, openwhydUrl } from "@/types/apiplaylist-helpers";
import type { ApiPlaylist } from "@/types/openwhyd-types";
import { PlaylistsIDs } from "@/types/playlists-types";
import ItemCover from "../item-cover";
import UserLink from "../user-link";

export default function TracksHeader({
	apiplaylistInfo,
}: {
	apiplaylistInfo: ApiPlaylist;
}) {
	const playlistCover = imgUrl(apiplaylistInfo.id);

	return (
		<div className="mx-6 playlist-container p-4 sm:p-6 mb-8 border-2 rounded-md flex bg-card">
			<ItemCover
				src={playlistCover}
				trackCount={apiplaylistInfo.nbTracks}
				isLarge={true}
			/>
			<div className="flex flex-col">
				<h1 className="ml-4 mb-1 text-xl lg:text-2xl font-bold leading-none text-ring">
					{`${apiplaylistInfo.name}`}
				</h1>

				<h2 className="mx-5 my-3 flex">
					{apiplaylistInfo.uId !== "" ? (
						<UserLink
							id={apiplaylistInfo.uId}
							name={apiplaylistInfo.uNm}
							withImg={true}
							isLarge={true}
						/>
					) : (
						""
					)}
				</h2>
				<div className="grow" />
				<div className="flex space-x-1 mb-2">
					{apiplaylistInfo.id !== PlaylistsIDs.UserStream ? (
						<a
							href={openwhydUrl(apiplaylistInfo)}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLinkIcon className="ml-4 h-6 w-6 inline" />
						</a>
					) : (
						""
					)}
				</div>
			</div>
		</div>
	);
}

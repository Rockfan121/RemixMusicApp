import { RowsIcon } from "@radix-ui/react-icons";
import { Link, NavLink } from "react-router";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { myUrl } from "@/types/apiplaylist-helpers";
import type { ApiPlaylist } from "@/types/openwhyd-types";

const PlaylistItem = ({
	title,
	subtitle,
	isIcon,
}: {
	title: React.ReactNode;
	subtitle: React.ReactNode;
	isIcon: boolean;
}) => (
	<>
		<div className="text-sm/4 py-2 hover:bg-accent">
			<span className="inline-block w-64 pl-2 truncate font-semibold">
				{isIcon && <RowsIcon className="inline" />} {title}
			</span>
			<br />
			<span className="inline-block w-64 pl-7 truncate text-muted-foreground">
				{subtitle}
			</span>
		</div>
		<Separator />
	</>
);

interface PlaylistScrollAreaProps {
	children: ApiPlaylist[];
	title: string;
	link: string;
}

/**
 * A component  containing a list of playlists (with their titles and authors)
 * @param  children - List of playlists to be displayed
 * @param  title - The title of the scroll area ("Recently played", "Favorites", etc.)
 * @param  link - The link to the page where the user can see more playlists
 */
export function PlaylistScrollArea({
	children,
	title,
	link,
}: PlaylistScrollAreaProps) {
	const EMPTY_STATE = {
		title: "There are no playlists there",
		subtitle: "Start enjoying the app 🎶",
	};

	return (
		<div className="aside-container w-full rounded-md border bg-card">
			<h4 className="m-3 mb-1 text-lg font-semibold leading-none text-ring">
				<Link to={link}>{title}</Link>
			</h4>
			<ScrollArea className="scroll-container w-full">
				<div className="p-2.5">
					{children.length > 0 ? (
						children.map((c) => (
							<NavLink
								to={myUrl(c)}
								key={c.id}
								className={({ isActive }) => (isActive ? "text-ring" : "")}
							>
								<PlaylistItem title={c.name} subtitle={c.uNm} isIcon={true} />
							</NavLink>
						))
					) : (
						<PlaylistItem
							title={EMPTY_STATE.title}
							subtitle={EMPTY_STATE.subtitle}
							isIcon={false}
						/>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

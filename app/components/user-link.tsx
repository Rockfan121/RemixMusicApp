import { Link } from "react-router";
import { userImg } from "@/services/openwhyd";

interface UserLinkProps {
	id: string;
	name: string;
	withImg: boolean;
	isLarge: boolean;
}

/**
 * Component displaying username and optionally their avatar. It's a hyperlink to Explore view for the given user.
 * @param id - user id
 * @param name - user name
 * @param withImg - should the user's avatar be displayed?
 * @param isLarge - what is the size of the component?
 */
export default function UserLink({
	id,
	name,
	withImg,
	isLarge,
}: UserLinkProps) {
	const fontSize = isLarge
		? "text-lg text-muted-foreground"
		: "text-sm text-muted-foreground";
	const imgSize = isLarge ? "size-8" : "size-5";

	return (
		<Link to={`/player/exploring?q=${id}`} className="flex space-x-1.5">
			{withImg ? (
				<div
					className={`flex ${imgSize} overflow-hidden rounded-md album-cover`}
				>
					<img
						src={userImg(id)}
						alt={`${name} avatar`}
						aria-hidden
						className="aspect-square h-fit w-fit object-cover rounded-full"
					/>
				</div>
			) : (
				""
			)}
			<div className={`flex ${fontSize}`}>{name}</div>
		</Link>
	);
}

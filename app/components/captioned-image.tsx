import { Link } from "react-router";
import ItemCover from "./item-cover";

interface CaptionedImageProps {
	title: string;
	subtitle: string;
	coverImg: string;
	trackCount?: number;
	url: string;
}

/**
 * Component displaying some image and basic information about a given playlist, user, etc.
 * @param title - the playlist name (or the name of the user)
 * @param subtitle - the author of the playlist (or an empty string)
 * @param coverImg - the URL to the cover image (or user avatar)
 * @param trackCount - number of tracks to display on the cover image
 * @param url - url to the playlist or user
 */
export default function CaptionedImage({
	title,
	subtitle,
	coverImg,
	trackCount,
	url,
}: CaptionedImageProps) {
	return (
		<Link to={url}>
			<figure>
				<ItemCover src={coverImg} trackCount={trackCount} />
				<figcaption className="pt-1 font-semibold text-xs sm:text-sm text-foreground">
					{title} <br />
					<span className="text-muted-foreground">{subtitle}</span>
				</figcaption>
			</figure>
		</Link>
	);
}

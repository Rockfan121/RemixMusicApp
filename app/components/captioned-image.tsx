import ItemCover from "./item-cover";

interface CaptionedImageProps {
	title: string;
	subtitle: string;
	coverImg: string;
	trackCount?: number;
}

/**
 * Component displaying some image and basic information about a given playlist, user, etc.
 * @param title - the playlist name (or the name of the user)
 * @param subtitle - the author of the playlist (or an empty string)
 * @param coverImg - the URL to the cover image (or user avatar)
 * @param trackCount - number of tracks to display on the cover image
 */
export default function CaptionedImage({
	title,
	subtitle,
	coverImg,
	trackCount,
}: CaptionedImageProps) {
	return (
		<figure>
			<ItemCover src={coverImg} trackCount={trackCount} />
			<figcaption className="pt-1 font-semibold text-xs sm:text-sm text-foreground">
				{title} <br />
				<span className="text-muted-foreground">{subtitle}</span>
			</figcaption>
		</figure>
	);
}

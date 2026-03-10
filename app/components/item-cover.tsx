interface ItemCoverProps {
	title: string;
	subtitle: string;
	coverImg: string;
	altText: string;
}

/**
 * Component displaying some image and basic information about a given playlist, user, etc.
 * @param title - the playlist name (or the name of the user)
 * @param subtitle - the author of the playlist (or an empty string)
 * @param coverImg - the URL to the cover image (or user avatar)
 * @param altText - the alt text for the cover image (or user avatar)
 */
export default function ItemCover({
	title,
	subtitle,
	coverImg,
	altText,
}: ItemCoverProps) {
	return (
		<figure>
			<div className="w-28 h-28 overflow-hidden rounded-md album-cover relative">
				<img
					src={coverImg}
					alt={altText}
					aria-hidden
					className="aspect-square h-fit w-fit object-cover"
				/>
				<span className="absolute bottom-0 left-0 text-sm font-bold italic text-muted-foreground">100 tracks</span>
			</div>
			<figcaption className="pt-1 font-semibold text-sm text-foreground">
				{title} <br />
				<span className="text-muted-foreground">{subtitle}</span>
			</figcaption>
		</figure>
	);
}

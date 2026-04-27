import { cn } from "@/lib/styles";

interface ItemCoverProps {
	src: string;
	trackCount?: number;
	isLarge?: boolean;
	isAvatar?: boolean;
}

/**
 * Displays a playlist (or user) cover image with a track count label overlaid at the bottom-right.
 * @param src - URL of the cover image
 * @param trackCount - number of tracks to display in the label
 * @param isLarge - what is the size of the component?
 * @param isAvatar - is it a user cover image? (If not, it's a playlist cover)
 */
export default function ItemCover({
	src,
	trackCount,
	isLarge = false,
	isAvatar = false,
}: ItemCoverProps) {
	const imgSize = isLarge
		? "size-26 sm:size-32 lg:size-40"
		: "size-22 sm:size-26 lg:size-28";
	return (
		<div
			className={cn(
				"relative cover-image cover-background-image",
				isAvatar ? "rounded-full" : "rounded-xl",
				imgSize,
			)}
		>
			<img
				src={src}
				aria-hidden
				alt=" "
				className={cn(
					"cover-image",
					isAvatar ? "rounded-full" : "rounded-md",
					imgSize,
				)}
			/>
			{trackCount !== undefined && trackCount >= 0 && (
				<span className="bg-secondary/90 rounded-xl px-1 text-sm absolute bottom-0 right-0 italic hidden sm:block">
					{trackCount} tracks
				</span>
			)}
		</div>
	);
}

import { cn } from "@/lib/styles";

interface PlaylistImageProps {
	src: string;
	trackCount?: number;
	isLarge: boolean;
}

/**
 * Displays a playlist (or user) cover image with a track count label overlaid at the bottom-left.
 * @param src - URL of the cover image
 * @param trackCount - number of tracks to display in the label
 * @param isLarge - what is the size of the component?
 */
export default function PlaylistImage({
	src,
	trackCount,
	isLarge,
}: PlaylistImageProps) {
	const imgSize = isLarge
		? "size-26 sm:size-32 lg:size-40"
		: "size-22 sm:size-26 lg:size-28";
	return (
		<div
			className={cn(
				"relative playlist-image playlist-background-image rounded-xl",
				imgSize,
			)}
		>
			<img
				src={src}
				aria-hidden
				alt=" "
				className={cn("playlist-image rounded-md", imgSize)}
			/>
			{trackCount !== undefined && trackCount >= 0 && (
				<span className="bg-secondary/90 rounded-xl px-1 text-sm absolute bottom-0 right-0 italic hidden sm:block">
					{trackCount} tracks
				</span>
			)}
		</div>
	);
}

import { type MutableRefObject, useEffect, useRef } from "react";

interface DailymotionSkipperProps {
	onSkip: () => unknown;
	trackToken: number;
}

export default function DailymotionSkipper({
	onSkip,
	trackToken,
}: DailymotionSkipperProps) {
	const lastTokenRef = useRef<number | null>(null) as MutableRefObject<
		number | null
	>;

	useEffect(() => {
		if (lastTokenRef.current === trackToken) return;
		lastTokenRef.current = trackToken;
		onSkip();
	}, [onSkip, trackToken]);

	return <div />;
}

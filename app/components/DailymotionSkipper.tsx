import { useEffect, useRef } from "react";

interface DailymotionSkipperProps {
	onSkip: () => void;
	trackToken: number;
}

export default function DailymotionSkipper({
	onSkip,
	trackToken,
}: DailymotionSkipperProps) {
	const lastTokenRef = useRef<number | null>(null);

	useEffect(() => {
		if (lastTokenRef.current === trackToken) return;
		lastTokenRef.current = trackToken;
		onSkip();
	}, [onSkip, trackToken]);

	return <div />;
}

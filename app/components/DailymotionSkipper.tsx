import { useEffect } from "react";

interface DailymotionSkipperProps {
	onSkip: () => void;
}

export default function DailymotionSkipper({
	onSkip,
}: DailymotionSkipperProps) {
	useEffect(() => {
		onSkip();
	}, [onSkip]);
	return <div />;
}

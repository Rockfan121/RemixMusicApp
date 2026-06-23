import { useEffect, useRef } from "react";

interface DailymotionSkipperProps {
	onSkip: () => unknown;
	trackToken: string;
}

export default function DailymotionSkipper({
	onSkip,
	trackToken,
}: DailymotionSkipperProps) {
	// Store the callback in a ref so it is always read at fire-time rather than
	// schedule-time, and so onSkip is excluded from the effect's dependency
	// array. This means a new onSkip reference (e.g. if useCallback is removed
	// from handleError) never re-triggers the effect or requires a lastTokenRef
	// guard to suppress spurious calls.
	const onSkipRef = useRef(onSkip);
	onSkipRef.current = onSkip;

	// biome-ignore lint/correctness/useExhaustiveDependencies: trackToken (id of the incoming track that has to be skipped) is the right trigger to fire this hook
	useEffect(() => {
		// Defer past the current effects flush so that useMusicPlayer's mount
		// effect (which aborts in-flight abortRef operations) runs first.
		// Without this, the mount effect would cancel the handleError sleep
		// immediately after DailymotionSkipper starts it (effects run child
		// before parent), leaving the player stuck on the Dailymotion track.
		const id = setTimeout(() => onSkipRef.current(), 0);
		return () => clearTimeout(id);
	}, [trackToken]);

	return <div />;
}

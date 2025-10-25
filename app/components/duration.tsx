/*Code from react-player Github repository - https://github.com/cookpete/react-player*/

interface DurationProps {
	seconds: number;
}

export function Duration({ seconds }: DurationProps) {
	return <time dateTime={`P${Math.round(seconds)}S`}>{format(seconds)}</time>;
}

function format(seconds: number) {
	const date = new Date(seconds * 1000);
	const hh = date.getUTCHours();
	const mm = date.getUTCMinutes();
	const ss = pad(date.getUTCSeconds());
	if (hh) {
		return `${hh}:${pad(mm)}:${ss}`;
	}
	return `${mm}:${ss}`;
}

function pad(s: number): string {
	return `0${s}`.slice(-2);
}

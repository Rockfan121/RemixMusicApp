import type { MetaFunction } from "react-router";
import { title } from "@/config.shared";

export const meta: MetaFunction = () => {
	return [{ title: title() }];
};

export default function Index() {
	return (
		<main className="flex h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-8 text-xl">
				<h1>Welcome to</h1>
				<h1 className="shadow-3xl shadow-primary bg-primary/81 rounded-md text-3xl font-bold">
					RemixMusicApp!
				</h1>
			</div>
		</main>
	);
}

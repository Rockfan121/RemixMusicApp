import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
	Outlet,
	isRouteErrorResponse,
	useRouteError,
	useRouteLoaderData,
} from "@remix-run/react";

import { Header } from "@/components/header";
import { PlaylistScrollArea } from "@/components/playlist-scroll-area";
import { getUser } from "@/lib/auth.server";
import { Separator } from "@radix-ui/react-dropdown-menu";

export const links: LinksFunction = () => {
	return [
		{
			rel: "icon",
			href: "../favicon.ico",
			type: "image/ico",
		},
	];
};

const tags = Array.from({ length: 3 }).map((_, i, a) => `Playlist no ${i}`);

export async function loader({ context, request }: LoaderFunctionArgs) {
	const user = await getUser(context, request);
	return { isAuthenticated: !!user };
}

function Layout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } =
		useRouteLoaderData<typeof loader>("routes/_shell") ?? {};

	return (
		<>
			<Header isAuthenticated={isAuthenticated} />
			<aside className="h-full w-80 fixed top-0 left-0 pt-14 pb-32 px-3 overflow-x-hidden hidden md:block">
				<PlaylistScrollArea title="Recently played" link="/player/recent">
					{tags}
				</PlaylistScrollArea>
				<Separator className="my-1.5" />

				<PlaylistScrollArea title="Favorites" link="/player/faves">
					{tags}
				</PlaylistScrollArea>
			</aside>
			<main className="md:ml-80 px-2 pt-14">{children}</main>
		</>
	);
}

export default function Shell() {
	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	let status = 500;
	let message = "An unexpected error occurred.";
	if (isRouteErrorResponse(error)) {
		status = error.status;
		switch (error.status) {
			case 404:
				status = 404;
				message = "Page Not Found";
				break;
		}
	} else {
		console.error(error);
	}

	return (
		<Layout>
			<div className="container prose py-8">
				<h1>{status}</h1>
				<p>{message}</p>
			</div>
		</Layout>
	);
}

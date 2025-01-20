import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
	Link,
	Outlet,
	isRouteErrorResponse,
	useRouteError,
	useRouteLoaderData,
} from "@remix-run/react";

import { Header } from "@/components/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getUser } from "@/lib/auth.server";
import { DoubleArrowRightIcon } from "@radix-ui/react-icons";

export const links: LinksFunction = () => {
	return [
		{
			rel: "icon",
			href: "../favicon.ico",
			type: "image/ico",
		},
	];
};

const tags = Array.from({ length: 50 }).map(
	(_, i, a) => `Playlist no ${a.length - i}`,
);

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
				<div className="aside-container w-full rounded-md border bg-card">
					<h4 className="m-3 text-lg leading-none text-ring">
						<Link to="/player/recent">Recently played</Link>
					</h4>
					<ScrollArea className="scroll-container w-full">
						<div className="p-2.5">
							{tags.map((tag) => (
								<span key={tag}>
									<div className="text-sm">
										<DoubleArrowRightIcon className="inline" />
										{` ${tag}-hello`}
									</div>
									<Separator className="my-2" />
								</span>
							))}
						</div>
					</ScrollArea>
				</div>
				<Separator className="my-1.5" />
				<div className="aside-container w-full rounded-md border bg-card">
					<h4 className="m-3 text-lg font-medium leading-none text-ring">
						<Link to="/player/faves">Favorites</Link>
					</h4>
					<ScrollArea className="scroll-container w-full">
						<div className="p-2.5">
							{tags.map((tag) => (
								<span key={tag}>
									<div className="text-sm">
										<DoubleArrowRightIcon className="inline" />
										{` ${tag}`}
									</div>
									<Separator className="my-2" />
								</span>
							))}
						</div>
					</ScrollArea>
				</div>
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

import type { LoaderFunctionArgs } from "react-router";
import {
	isRouteErrorResponse,
	Outlet,
	useRouteError,
	useRouteLoaderData,
} from "react-router";

import { Header } from "@/components/header";
import { getUser } from "@/lib/auth.server";
/* export const links: LinksFunction = () => {
	return [
		{
			rel: "icon",
			href: "../favicon.ico",
			type: "image/ico",
		},
	];
}; */

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
			<main>{children}</main>
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

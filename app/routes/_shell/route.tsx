import type { LoaderFunctionArgs } from "@remix-run/node";
import {
	Outlet,
	isRouteErrorResponse,
	useRouteError,
	useRouteLoaderData,
} from "@remix-run/react";

import { Header } from "@/components/header";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { getUser } from "@/lib/auth.server";

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`
)

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
								<aside className="h-full w-96 fixed top-0 left-0 py-24 px-5 overflow-x-hidden bg-secondary">
									<ScrollArea className="h-full w-full rounded-md border">
									<div className="p-4">
										<h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
										{tags.map((tag) => (
											<span key={tag}>
												<div className="text-sm">
													{tag}
												</div>
												<Separator className="my-2" />
											</span>
										))}
									</div>
								</ScrollArea>
							</aside>
				<main className="ml-96 px-0 py-10 overflow-auto">
					{children}
				</main>
			<footer className="w-full h-20 left-0 bottom-0 fixed bg-accent">
					Footer
			</footer>
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

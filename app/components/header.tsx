import {
	CounterClockwiseClockIcon,
	Crosshair2Icon,
	ExitIcon,
	LaptopIcon,
	MoonIcon,
	RocketIcon,
	StarFilledIcon,
	SunIcon,
} from "@radix-ui/react-icons";
import * as React from "react";
import { Form, Link } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

import {
	getTheme,
	setTheme as setSystemTheme,
} from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavbarButton } from "./navbar-button";

export function Header({
	isAuthenticated,
}: {
	isAuthenticated: boolean | undefined;
}) {
	const hydrated = useHydrated();
	const [, rerender] = React.useState({});
	const setTheme = React.useCallback((theme: string) => {
		setSystemTheme(theme);
		rerender({});
	}, []);
	const theme = getTheme();

	return (
		<>
			<Form id="logout-form" method="POST" action="/logout" />
			<header className="fixed z-10 flex w-full top-0 left-0 items-center justify-between px-4 bg-primary h-11">
				<div className="flex items-center space-x-3">
					<Link className="flex items-center space-x-2 text-white" to="/">
						<RocketIcon className="mx-1 h-8 w-8" />
						<span className="font-extrabold hidden md:inline">
							music under control
						</span>
					</Link>
				</div>
				<div className="flex items-center space-x-1">
					<NavbarButton link="/player/exploring" label="Explore">
						<Crosshair2Icon className="navbar-icon" />
					</NavbarButton>

					<NavbarButton link="/player/recent" label="Recently played">
						<CounterClockwiseClockIcon className="navbar-icon" />
					</NavbarButton>

					<NavbarButton link="/player/faves" label="Favorites">
						<StarFilledIcon className="navbar-icon" />
					</NavbarButton>
				</div>
				<div className="flex items-center space-x-4">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="w-10 h-10 rounded-full border text-white"
								size="icon"
								variant="ghost"
								title="Theme selector"
							>
								<span className="sr-only">Theme selector</span>
								{!hydrated ? null : theme === "dark" ? (
									<MoonIcon />
								) : theme === "light" ? (
									<SunIcon />
								) : (
									<LaptopIcon />
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mt-2">
							<DropdownMenuLabel>Theme</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<button
									type="button"
									className="w-full"
									onClick={() => setTheme("light")}
									aria-selected={theme === "light"}
								>
									Light
								</button>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<button
									type="button"
									className="w-full"
									onClick={() => setTheme("dark")}
									aria-selected={theme === "dark"}
								>
									Dark
								</button>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<button
									type="button"
									className="w-full"
									onClick={() => setTheme("system")}
									aria-selected={theme === "system"}
								>
									System
								</button>
							</DropdownMenuItem>

							<DropdownMenuItem asChild>
								<button
									type="button"
									className="w-full"
									onClick={() => setTheme("dkviolet")}
									aria-selected={theme === "dkviolet"}
								>
									Dark violet
								</button>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<button
									type="button"
									className="w-full"
									onClick={() => setTheme("sky")}
									aria-selected={theme === "sky"}
								>
									Sky
								</button>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					{isAuthenticated && (
						<Button
							form="logout-form"
							type="submit"
							className="w-10 h-10 rounded-full border  text-white"
							size="icon"
							variant="ghost"
							title="Logout"
						>
							<span className="sr-only">Logout</span>
							<ExitIcon />
						</Button>
					)}
				</div>
			</header>
		</>
	);
}

import { LaptopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import * as React from "react";
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

export function ThemeSwitcherButton() {
	const hydrated = useHydrated();
	const [, rerender] = React.useState({});
	const setTheme = React.useCallback((theme: string) => {
		setSystemTheme(theme);
		rerender({});
	}, []);
	const theme = getTheme();

	return (
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
				{(["light", "dark", "system", "dkviolet", "sky"] as const).map((t) => (
					<DropdownMenuItem key={t} asChild>
						<button
							type="button"
							className="w-full"
							onClick={() => setTheme(t)}
							aria-selected={theme === t}
						>
							{t.charAt(0).toUpperCase() + t.slice(1)}
						</button>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

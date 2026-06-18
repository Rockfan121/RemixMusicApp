import {
	CounterClockwiseClockIcon,
	Crosshair2Icon,
	RocketIcon,
} from "@radix-ui/react-icons";
import { Link } from "react-router";
import { NavbarButton } from "./navbar-button";

interface Props {
	rightSlot?: React.ReactNode;
}

export function Header({ rightSlot }: Props) {
	return (
		<header className="fixed z-10 flex w-full top-0 left-0 items-center justify-between px-4 bg-primary h-11">
			<div className="flex items-center space-x-3">
				<Link className="flex items-center space-x-2 text-white" to="/">
					<RocketIcon className="mx-1 h-8 w-8" />
					<span className="font-extrabold hidden md:inline">
						music under control
					</span>
				</Link>
			</div>

			<div className="flex items-center space-x-0.5">
				<NavbarButton link="/exploring" label="Explore">
					<Crosshair2Icon className="navbar-icon" />
				</NavbarButton>
				<NavbarButton link="/recent" label="Recently played">
					<CounterClockwiseClockIcon className="navbar-icon" />
				</NavbarButton>
			</div>

			<div className="flex items-center space-x-4">{rightSlot ?? <div />}</div>
		</header>
	);
}

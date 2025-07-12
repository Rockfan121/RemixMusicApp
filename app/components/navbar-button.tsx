import { NavLink } from "react-router";
import { Button } from "./ui/button";

interface NavbarButtonProps {
	children: React.ReactNode;
	link: string;
	label: string;
}

export function NavbarButton({ children, link, label }: NavbarButtonProps) {
	return (
		<NavLink
			to={link}
			className={({ isActive }) => (isActive ? "bg-ring rounded-md" : "")}
		>
			<Button variant="ghost" className="navbar-button">
				{children}
				<span className="hidden md:inline">{label}</span>
			</Button>
		</NavLink>
	);
}

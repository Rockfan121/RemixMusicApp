import { Toaster as Sonner, type ToasterProps } from "sonner";
import { lightOrDarkTheme } from "../theme-switcher";

const Toaster = ({ ...props }: ToasterProps) => {
	const theme = lightOrDarkTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			// style={
			//   {
			//     //"--normal-bg": "var(--popover)",
			//     //"--normal-text": "var(--popover-foreground)",
			//     "--normal-border": "var(--border)",
			//     "--border-radius": "var(--radius)",
			//   } as React.CSSProperties
			// }
			{...props}
		/>
	);
};

export { Toaster };

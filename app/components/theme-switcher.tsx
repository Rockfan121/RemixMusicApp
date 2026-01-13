export type Theme = "light" | "dark" | "system" | "dkviolet" | "sky";

/**
 * This component is used to set the theme based on the value at hydration time.
 * If no value is found, it will default to the user's system preference and
 * coordinates with the ThemeSwitcherScript to prevent a flash of unstyled content
 * and a React hydration mismatch.
 */
export function ThemeSwitcherSafeHTML({
	children,
	lang,
	...props
}: React.HTMLProps<HTMLHtmlElement> & { lang: string }) {
	const dataTheme =
		typeof document === "undefined"
			? undefined
			: document.documentElement.getAttribute("data-theme") || undefined;

	return (
		<html {...props} lang={lang} data-theme={dataTheme}>
			{children}
		</html>
	);
}

/**
 * This script will run on the client to set the theme based on the value in
 * localStorage. If no value is found, it will default to the user's system
 * preference.
 *
 * IMPORTANT: This script should be placed at the end of the <head> tag to
 * prevent a flash of unstyled content.
 */
export function ThemeSwitcherScript() {
	return (
		<script
			// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
			dangerouslySetInnerHTML={{
				__html: `
          (function() {
            var theme = localStorage.getItem("theme");
            if (theme) {
              document.documentElement.setAttribute("data-theme", theme);
            }
          })();
        `,
			}}
		/>
	);
}
export function lightOrDarkTheme() {
	const theme = getTheme();
	return theme === "dkviolet" || theme === "sky" ? "dark" : theme;
}

export function getTheme() {
	return validateTheme(
		typeof document === "undefined" ? "system" : localStorage.getItem("theme"),
	);
}

/**
 * This function will change the theme and store the
 * value in localStorage.
 */

export function setTheme(theme: Theme | string) {
	let themeToSet: Theme | null = validateTheme(theme);
	if (themeToSet === "system") {
		themeToSet = null;
	}
	if (themeToSet) {
		localStorage.setItem("theme", themeToSet);
		document.documentElement.setAttribute("data-theme", themeToSet);
	} else {
		localStorage.removeItem("theme");
		document.documentElement.removeAttribute("data-theme");
	}
}

function validateTheme(theme: string | null): Theme {
	return theme === "light" ||
		theme === "dark" ||
		theme === "system" ||
		theme === "dkviolet" ||
		theme === "sky"
		? theme
		: "system";
}

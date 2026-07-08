import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
	ssr: {
		resolve: {
			externalConditions: ["node"],
		},
	},
	plugins: [tailwindcss(), envOnlyMacros(), tsconfigPaths(), reactRouter()],
	test: {
		environment: "jsdom",
		globals: false,
		setupFiles: ["./app/test/setup.ts"],
		include: ["app/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			include: ["app/**/*.{ts,tsx}"],
			exclude: [
				"app/components/ui/**",
				"app/test/**",
				"app/mocks/**",
				"app/**/*.test.{ts,tsx}",
				"app/entry.client.tsx",
				"app/entry.server.tsx",
				"app/root.tsx",
			],
		},
	},
}));

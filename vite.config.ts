import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import envOnly from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
	ssr: {
		resolve: {
			externalConditions: ["node"],
		},
	},
	plugins: [
		tailwindcss(),
		envOnly(), //since 3.x.x envOnlyMacros()
		tsconfigPaths(),
		...(mode === "test" ? [] : [reactRouter()]),
	],
	test: {
		environment: "jsdom",
		globals: true,
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
			],
		},
	},
}));

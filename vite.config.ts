import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import envOnly from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
	ssr: {
		resolve: {
			externalConditions: ["node"],
		},
	},
	optimizeDeps: {
		exclude: ["bcryptjs", "better-sqlite3", "drizzle-orm", "fsevents"],
	},
	plugins: [
		tailwindcss(),
		envOnly(),
		tsconfigPaths(),
		reactRouter(),
		{
			name: "ssr-entries",
			config(userConfig, { isSsrBuild }) {
				if (isSsrBuild) {
					const userInput = userConfig.build?.rollupOptions?.input;
					if (typeof userInput !== "string")
						throw new Error("Invalid base input");

					return {
						...userConfig,
						build: {
							...userConfig.build,
							rollupOptions: {
								...userConfig.build?.rollupOptions,
								input: [userInput, "./app/db.server/schema.ts"],
							},
						},
					};
				}
			},
		},
	],
}));

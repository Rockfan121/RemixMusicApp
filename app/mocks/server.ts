import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** MSW Node server — used in all Vitest tests via app/test/setup.ts */
export const server = setupServer(...handlers);

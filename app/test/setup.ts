import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { server } from "@/mocks/server";

// Start MSW server before all tests, reset handlers after each test,
// and stop the server after all tests have run.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
	cleanup();
	server.resetHandlers();
});
afterAll(() => server.close());

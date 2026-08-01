// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sleep } from "@/helpers/timeouts";

describe("sleep", () => {
	it("resolves after the given delay", async () => {
		const controller = new AbortController();
		await expect(sleep(10, controller.signal)).resolves.toBeUndefined();
	});

	it("rejects with a DOMException when the signal is aborted", async () => {
		const controller = new AbortController();
		const promise = sleep(60_000, controller.signal);
		controller.abort();
		await expect(promise).rejects.toBeInstanceOf(DOMException);
	});

	it("rejects with an 'Aborted' message when the signal is aborted", async () => {
		const controller = new AbortController();
		const promise = sleep(60_000, controller.signal);
		controller.abort();
		await expect(promise).rejects.toMatchObject({ message: "Aborted" });
	});
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "@/shared/api";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("HTTP transport", () => {
  it("encodes JSON and preserves headers", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"id":1}'));
    vi.stubGlobal("fetch", fetcher);
    expect(
      await request("/api", {
        method: "POST",
        json: { name: "Ada" },
        headers: { "X-Test": "yes" },
      }),
    ).toEqual({ id: 1 });
    const options = fetcher.mock.calls[0][1];
    expect(options.headers.get("Content-Type")).toBe("application/json");
    expect(options.headers.get("X-Test")).toBe("yes");
    expect(options.body).toBe('{"name":"Ada"}');
  });
  it("handles empty responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    expect(await request("/api")).toBeUndefined();
  });
  it.each([
    [new Response("unavailable", { status: 503 }), "http"],
    [new Response("not json"), "parse"],
  ])("normalizes response errors", async (response, kind) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(request("/api")).rejects.toMatchObject({ kind });
  });
  it("normalizes network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(request("/api")).rejects.toMatchObject({ kind: "network" });
  });
  it("distinguishes cancellation from timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_, reject) => {
            options.signal.addEventListener("abort", () =>
              reject(new DOMException("Abort", "AbortError")),
            );
          }),
      ),
    );
    const controller = new AbortController();
    const pending = request("/api", { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: "aborted" });
  });
  it("aborts slow requests", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_, reject) => {
            options.signal.addEventListener("abort", () =>
              reject(new DOMException("Abort", "AbortError")),
            );
          }),
      ),
    );
    const pending = expect(
      request("/api", { timeoutMs: 10 }),
    ).rejects.toMatchObject({ kind: "timeout" });
    await vi.advanceTimersByTimeAsync(11);
    await pending;
  });
});

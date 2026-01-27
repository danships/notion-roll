import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "../../src/api/client.js";
import { NotionRollError } from "../../src/types.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function createMockResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
  } as unknown as Response;
}

describe("ApiClient", () => {
  const apiKey = "test-api-key";
  let client: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ApiClient({ apiKey });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("headers", () => {
    it("sends correct Authorization header", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { data: "test" }));

      await client.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        })
      );
    });

    it("sends correct Notion-Version header with default", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { data: "test" }));

      await client.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Notion-Version": "2025-09-03",
          }),
        })
      );
    });

    it("sends custom Notion-Version when configured", async () => {
      const customClient = new ApiClient({ apiKey, notionVersion: "2024-01-01" });
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { data: "test" }));

      await customClient.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Notion-Version": "2024-01-01",
          }),
        })
      );
    });

    it("sends Content-Type header", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { data: "test" }));

      await client.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("HTTP methods", () => {
    it("GET sends correct method and URL", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { id: "123" }));

      const result = await client.get<{ id: string }>("/pages/123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.notion.com/v1/pages/123",
        expect.objectContaining({ method: "GET", body: undefined })
      );
      expect(result).toEqual({ id: "123" });
    });

    it("POST sends correct method and body", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { id: "new" }));
      const body = { title: "Test" };

      const result = await client.post<{ id: string }>("/pages", body);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.notion.com/v1/pages",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual({ id: "new" });
    });

    it("PATCH sends correct method and body", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { id: "123" }));
      const body = { title: "Updated" };

      const result = await client.patch<{ id: string }>("/pages/123", body);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.notion.com/v1/pages/123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(body),
        })
      );
      expect(result).toEqual({ id: "123" });
    });

    it("DELETE sends correct method", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { archived: true }));

      const result = await client.delete<{ archived: boolean }>("/pages/123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.notion.com/v1/pages/123",
        expect.objectContaining({ method: "DELETE", body: undefined })
      );
      expect(result).toEqual({ archived: true });
    });

    it("uses custom baseUrl when configured", async () => {
      const customClient = new ApiClient({
        apiKey,
        baseUrl: "https://custom.api.com",
      });
      mockFetch.mockResolvedValueOnce(createMockResponse(200, {}));

      await customClient.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom.api.com/test",
        expect.any(Object)
      );
    });
  });

  describe("error mapping", () => {
    it("throws NotionRollError with status and code from response", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(404, {
          code: "object_not_found",
          message: "Page not found",
        })
      );

      const error = await client.get("/pages/missing").catch((e) => e);
      expect(error).toBeInstanceOf(NotionRollError);
      expect(error).toMatchObject({
        status: 404,
        code: "object_not_found",
        message: "Page not found",
      });
    });

    it("uses default message when response has no message", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(500, {}));

      await expect(client.get("/test")).rejects.toMatchObject({
        status: 500,
        message: "Request failed with status 500",
      });
    });

    it("uses unknown_error code when response has no code", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(400, { message: "Bad request" })
      );

      await expect(client.get("/test")).rejects.toMatchObject({
        code: "unknown_error",
      });
    });

    it("handles non-JSON error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error("Invalid JSON")),
        headers: { get: () => null },
      } as unknown as Response);

      await expect(client.get("/test")).rejects.toMatchObject({
        status: 502,
        code: "unknown_error",
      });
    });

    it("includes error details in NotionRollError", async () => {
      const errorBody = {
        code: "validation_error",
        message: "Invalid property",
        details: { property: "title" },
      };
      mockFetch.mockResolvedValueOnce(createMockResponse(400, errorBody));

      await expect(client.post("/pages", {})).rejects.toMatchObject({
        details: errorBody,
      });
    });
  });

  describe("rate limiting", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("retries on 429 with exponential backoff", async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(429, {}, {}))
        .mockResolvedValueOnce(createMockResponse(429, {}, {}))
        .mockResolvedValueOnce(createMockResponse(200, { success: true }));

      const promise = client.get("/test");

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("uses Retry-After header when provided", async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(429, {}, { "Retry-After": "5" }))
        .mockResolvedValueOnce(createMockResponse(200, { success: true }));

      const promise = client.get("/test");

      await vi.advanceTimersByTimeAsync(5000);

      const result = await promise;
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("fails after MAX_RETRIES (3) attempts", async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(429, {}, {}))
        .mockResolvedValueOnce(createMockResponse(429, {}, {}))
        .mockResolvedValueOnce(createMockResponse(429, {}, {}))
        .mockResolvedValueOnce(createMockResponse(429, {}, {}));

      let caughtError: unknown;
      const promise = client.get("/test").catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(caughtError).toBeInstanceOf(NotionRollError);
      expect(caughtError).toMatchObject({
        status: 429,
        code: "rate_limited",
        message: "Rate limit exceeded after max retries",
      });
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("uses exponential backoff delays (1s, 2s, 4s)", async () => {
      const sleepSpy = vi.spyOn(global, "setTimeout");
      mockFetch
        .mockResolvedValueOnce(createMockResponse(429, {}, {}))
        .mockResolvedValueOnce(createMockResponse(429, {}, {}))
        .mockResolvedValueOnce(createMockResponse(429, {}, {}))
        .mockResolvedValueOnce(createMockResponse(429, {}, {}));

      const promise = client.get("/test").catch(() => {});

      await vi.runAllTimersAsync();
      await promise;

      const delays = sleepSpy.mock.calls.map((call) => call[1]);
      expect(delays).toEqual([1000, 2000, 4000]);
    });
  });
});

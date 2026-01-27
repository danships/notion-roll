import type { IncomingMessage, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotionRollError } from "notion-roll";
import {
  parseJsonBody,
  sendJson,
  sendError,
  handleError,
  getNotionClient,
} from "../../src/utils.js";

function createMockRequest(): IncomingMessage {
  const emitter = new EventEmitter();
  return Object.assign(emitter, {
    headers: {},
  }) as unknown as IncomingMessage;
}

function createMockResponse(): ServerResponse & {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: "",
    writeHead(status: number, headers: Record<string, string>) {
      this.statusCode = status;
      Object.assign(this.headers, headers);
    },
    end(data: string) {
      this.body = data;
    },
  };
  return res as unknown as ServerResponse & {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
}

describe("parseJsonBody", () => {
  it("parses valid JSON", async () => {
    const req = createMockRequest();
    const promise = parseJsonBody<{ foo: string }>(req);

    req.emit("data", Buffer.from('{"foo":"bar"}'));
    req.emit("end");

    const result = await promise;
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns empty object for empty body", async () => {
    const req = createMockRequest();
    const promise = parseJsonBody(req);

    req.emit("end");

    const result = await promise;
    expect(result).toEqual({});
  });

  it("rejects on invalid JSON", async () => {
    const req = createMockRequest();
    const promise = parseJsonBody(req);

    req.emit("data", Buffer.from("not valid json"));
    req.emit("end");

    await expect(promise).rejects.toThrow("Invalid JSON body");
  });

  it("handles request errors", async () => {
    const req = createMockRequest();
    const promise = parseJsonBody(req);

    const error = new Error("Connection reset");
    req.emit("error", error);

    await expect(promise).rejects.toThrow("Connection reset");
  });
});

describe("sendJson", () => {
  it("sets correct status and Content-Type header", () => {
    const res = createMockResponse();

    sendJson(res, 200, { success: true });

    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toBe("application/json");
  });

  it("sends JSON-stringified body", () => {
    const res = createMockResponse();

    sendJson(res, 201, { id: 123, name: "test" });

    expect(res.body).toBe('{"id":123,"name":"test"}');
  });
});

describe("sendError", () => {
  it("sends error object with correct status", () => {
    const res = createMockResponse();

    sendError(res, 404, "Not found");

    expect(res.statusCode).toBe(404);
    expect(res.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(res.body)).toEqual({ error: "Not found" });
  });
});

describe("handleError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles NotionRollError correctly", () => {
    const res = createMockResponse();
    const error = new NotionRollError("Database not found", 404, "not_found", {
      databaseId: "abc123",
    });

    handleError(res, error);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({
      error: "Database not found",
      code: "not_found",
      details: { databaseId: "abc123" },
    });
  });

  it('handles "Invalid JSON body" Error with 400', () => {
    const res = createMockResponse();
    const error = new Error("Invalid JSON body");

    handleError(res, error);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ error: "Invalid JSON body" });
  });

  it("handles generic Error with 500", () => {
    const res = createMockResponse();
    const error = new Error("Something went wrong");

    handleError(res, error);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: "Internal server error" });
    expect(console.error).toHaveBeenCalledWith("Unexpected error:", error);
  });

  it("handles unknown errors with 500", () => {
    const res = createMockResponse();

    handleError(res, "string error");

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ error: "Internal server error" });
    expect(console.error).toHaveBeenCalledWith("Unknown error:", "string error");
  });
});

describe("getNotionClient", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("extracts API key from Bearer token", () => {
    const req = createMockRequest();
    req.headers.authorization = "Bearer secret-api-key";

    const client = getNotionClient(req);

    expect(client).toBeDefined();
  });

  it("falls back to NOTION_API_KEY env var", () => {
    vi.stubEnv("NOTION_API_KEY", "env-api-key");
    const req = createMockRequest();

    const client = getNotionClient(req);

    expect(client).toBeDefined();
  });

  it("throws NotionRollError when no key provided", () => {
    vi.stubEnv("NOTION_API_KEY", "");
    const req = createMockRequest();

    expect(() => getNotionClient(req)).toThrow(NotionRollError);
    try {
      getNotionClient(req);
    } catch (error) {
      expect(error).toBeInstanceOf(NotionRollError);
      expect((error as NotionRollError).status).toBe(401);
      expect((error as NotionRollError).code).toBe("unauthorized");
    }
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";
import { startTestServer, stopTestServer, getTestConfig } from "./setup.js";

describe("Server API", () => {
  let server: Server;
  let baseUrl: string;
  let apiKey: string;
  let parentPageId: string;
  let containerPageId: string;
  const createdPageIds: string[] = [];

  beforeAll(async () => {
    const config = getTestConfig();
    apiKey = config.apiKey;
    parentPageId = config.parentPageId;

    const result = await startTestServer();
    server = result.server;
    baseUrl = result.baseUrl;

    // Create a container page for tests
    const response = await fetch(`${baseUrl}/api/pages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        parent: { pageId: parentPageId },
        title: `Server Test Container ${Date.now()}`,
        content: "Container for server integration tests",
      }),
    });

    const container = await response.json();
    containerPageId = container.id;
  });

  afterAll(async () => {
    // Archive all created pages
    for (const pageId of createdPageIds) {
      try {
        await fetch(`${baseUrl}/api/pages/${pageId}/archive`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    // Archive container
    if (containerPageId) {
      try {
        await fetch(`${baseUrl}/api/pages/${containerPageId}/archive`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      } catch {
        // Ignore
      }
    }

    await stopTestServer(server);
  });

  describe("GET /health", () => {
    it("returns ok status", async () => {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: "ok" });
    });
  });

  describe("POST /api/pages", () => {
    it("creates a page with title only", async () => {
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { pageId: containerPageId },
          title: "API Test - Title Only",
        }),
      });

      const page = await response.json();
      createdPageIds.push(page.id);

      expect(response.status).toBe(201);
      expect(page.id).toBeDefined();
      expect(page.title).toBe("API Test - Title Only");
    });

    it("creates a page with markdown content", async () => {
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { pageId: containerPageId },
          title: "API Test - With Content",
          content: "# Hello\n\nThis is **markdown**.",
        }),
      });

      const page = await response.json();
      createdPageIds.push(page.id);

      expect(response.status).toBe(201);
      expect(page.title).toBe("API Test - With Content");
    });

    it("returns 400 for missing required fields", async () => {
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("falls back to NOTION_API_KEY env var when no auth header", async () => {
      // Server uses NOTION_API_KEY env var as fallback, so this should succeed
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent: { pageId: containerPageId },
          title: "API Test - Env Fallback",
        }),
      });

      const page = await response.json();
      if (page.id) createdPageIds.push(page.id);

      expect(response.status).toBe(201);
    });
  });

  describe("GET /api/pages/:id", () => {
    it("gets a page with content", async () => {
      // First create a page
      const createResponse = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { pageId: containerPageId },
          title: "API Test - Get",
          content: "Content to fetch.",
        }),
      });

      const created = await createResponse.json();
      createdPageIds.push(created.id);

      // Then get it
      const response = await fetch(`${baseUrl}/api/pages/${created.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const page = await response.json();

      expect(response.status).toBe(200);
      expect(page.id).toBe(created.id);
      expect(page.title).toBe("API Test - Get");
      expect(page.content).toContain("Content to fetch");
    });
  });

  describe("PATCH /api/pages/:id", () => {
    it("updates page title", async () => {
      // Create a page
      const createResponse = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { pageId: containerPageId },
          title: "Original Title",
        }),
      });

      const created = await createResponse.json();
      createdPageIds.push(created.id);

      // Update it
      const response = await fetch(`${baseUrl}/api/pages/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ title: "Updated Title" }),
      });

      const page = await response.json();

      expect(response.status).toBe(200);
      expect(page.title).toBe("Updated Title");
    });

    it("replaces page content", async () => {
      const createResponse = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { pageId: containerPageId },
          title: "API Test - Replace Content",
          content: "Original content.",
        }),
      });

      const created = await createResponse.json();
      createdPageIds.push(created.id);

      const response = await fetch(`${baseUrl}/api/pages/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          content: "Replaced content.",
          contentMode: "replace",
        }),
      });

      const page = await response.json();

      expect(response.status).toBe(200);
      expect(page.content).toContain("Replaced content");
      expect(page.content).not.toContain("Original content");
    });

    it("appends page content", async () => {
      const createResponse = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { pageId: containerPageId },
          title: "API Test - Append Content",
          content: "Original content.",
        }),
      });

      const created = await createResponse.json();
      createdPageIds.push(created.id);

      const response = await fetch(`${baseUrl}/api/pages/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          content: "Appended content.",
          contentMode: "append",
        }),
      });

      const page = await response.json();

      expect(response.status).toBe(200);
      expect(page.content).toContain("Original content");
      expect(page.content).toContain("Appended content");
    });
  });

  describe("POST /api/pages/:id/archive", () => {
    it("archives a page", async () => {
      const createResponse = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { pageId: containerPageId },
          title: "API Test - Archive",
        }),
      });

      const created = await createResponse.json();

      const response = await fetch(`${baseUrl}/api/pages/${created.id}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const page = await response.json();

      expect(response.status).toBe(200);
      expect(page.id).toBe(created.id);
    });
  });

  describe("Error handling", () => {
    it("returns 404 for unknown routes", async () => {
      const response = await fetch(`${baseUrl}/api/unknown`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status).toBe(404);
    });

    it("handles CORS preflight", async () => {
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: "OPTIONS",
      });

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });
  });
});

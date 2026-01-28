import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";
import { startTestServer, stopTestServer, getTestConfig, createTestDatabase, type TestDatabase } from "./setup.js";

describe("Server Database API", () => {
  let server: Server;
  let baseUrl: string;
  let apiKey: string;
  let parentPageId: string;
  let testDb: TestDatabase;
  const createdPageIds: string[] = [];

  beforeAll(async () => {
    const config = getTestConfig();
    apiKey = config.apiKey;
    parentPageId = config.parentPageId;

    const result = await startTestServer();
    server = result.server;
    baseUrl = result.baseUrl;

    testDb = await createTestDatabase(baseUrl, apiKey, parentPageId);
  });

  afterAll(async () => {
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

    await testDb.cleanup();
    await stopTestServer(server);
  });

  describe("POST /api/databases", () => {
    it("creates a database", async () => {
      const response = await fetch(`${baseUrl}/api/databases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parentPageId,
          title: `Temp DB ${Date.now()}`,
          properties: {
            Name: { title: {} },
            Count: { number: {} },
          },
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.title).toContain("Temp DB");

      await fetch(`${baseUrl}/api/databases/${data.id}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    });

    it("returns 400 for missing fields", async () => {
      const response = await fetch(`${baseUrl}/api/databases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ title: "Missing parent" }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/databases/:id/data-sources", () => {
    it("returns data sources for a database", async () => {
      const response = await fetch(`${baseUrl}/api/databases/${testDb.databaseId}/data-sources`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.dataSources).toBeDefined();
      expect(Array.isArray(data.dataSources)).toBe(true);
      expect(data.dataSources.length).toBeGreaterThan(0);
      expect(data.dataSources[0]).toHaveProperty("id");
      expect(data.dataSources[0]).toHaveProperty("type");
    });
  });

  describe("GET /api/databases/:id/schema", () => {
    it("returns schema for a data source", async () => {
      const response = await fetch(`${baseUrl}/api/databases/${testDb.dataSourceId}/schema`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status).toBe(200);
      const schema = await response.json();
      expect(schema.id).toBeDefined();
      expect(schema.title).toBeDefined();
      expect(schema.properties).toBeDefined();
      expect(typeof schema.properties).toBe("object");
    });
  });

  describe("POST /api/databases/:id/query", () => {
    it("queries pages from a data source", async () => {
      const response = await fetch(`${baseUrl}/api/databases/${testDb.dataSourceId}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ pageSize: 10 }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.hasMore).toBe("boolean");
    });

    it("queries with sorting", async () => {
      const response = await fetch(`${baseUrl}/api/databases/${testDb.dataSourceId}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sorts: [{ timestamp: "created_time", direction: "descending" }],
          pageSize: 5,
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.results).toBeDefined();
      expect(result.results.length).toBeLessThanOrEqual(5);
    });

  });

  describe("POST /api/pages with dataSourceId parent", () => {
    it("creates a page in a data source", async () => {
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { dataSourceId: testDb.dataSourceId },
          title: `API DB Page ${Date.now()}`,
        }),
      });

      expect(response.status).toBe(201);
      const page = await response.json();
      createdPageIds.push(page.id);
      expect(page.id).toBeDefined();
      expect(page.title).toContain("API DB Page");
    });

    it("creates a page with properties", async () => {
      const response = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { dataSourceId: testDb.dataSourceId },
          title: `API DB Page Props ${Date.now()}`,
          properties: {
            Priority: 7,
            Done: true,
            Notes: "Created via API",
          },
        }),
      });

      expect(response.status).toBe(201);
      const page = await response.json();
      createdPageIds.push(page.id);
      expect(page.id).toBeDefined();
    });
  });

  describe("PATCH /api/pages/:id with database page", () => {
    it("updates properties on a database page", async () => {
      const createResponse = await fetch(`${baseUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parent: { dataSourceId: testDb.dataSourceId },
          title: `API Update Test ${Date.now()}`,
          properties: {
            Priority: 1,
            Done: false,
          },
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
          properties: {
            Priority: 100,
            Done: true,
          },
        }),
      });

      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.id).toBe(created.id);
    });
  });

  describe("POST /api/databases/:id/archive", () => {
    it("archives a database", async () => {
      const createResponse = await fetch(`${baseUrl}/api/databases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          parentPageId,
          title: `Archive Test DB ${Date.now()}`,
          properties: {
            Name: { title: {} },
          },
        }),
      });

      const created = await createResponse.json();

      const response = await fetch(`${baseUrl}/api/databases/${created.id}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.id).toBe(created.id);
    });
  });
});

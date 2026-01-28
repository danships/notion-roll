import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient, getTestConfig, createTestDatabase, type TestDatabase } from "./setup.js";
import type { NotionRoll } from "../../src/index.js";

describe("Database and Data Source operations", () => {
  let client: NotionRoll;
  let testDb: TestDatabase;
  const createdPageIds: string[] = [];

  beforeAll(async () => {
    const { parentPageId } = getTestConfig();
    client = createTestClient();
    testDb = await createTestDatabase(parentPageId);
  });

  afterAll(async () => {
    for (const pageId of createdPageIds) {
      try {
        await client.archivePage(pageId);
      } catch {
        // Ignore errors during cleanup
      }
    }

    await testDb.cleanup();
  });

  describe("getDataSources", () => {
    it("retrieves data sources for a database", async () => {
      const dataSources = await client.getDataSources(testDb.databaseId);

      expect(dataSources.length).toBeGreaterThan(0);
      expect(dataSources[0]).toHaveProperty("id");
      expect(dataSources[0]).toHaveProperty("type");
      expect(["default", "external"]).toContain(dataSources[0].type);
    });
  });

  describe("getDataSourceSchema", () => {
    it("retrieves schema for a data source", async () => {
      const schema = await client.getDataSourceSchema(testDb.dataSourceId);

      expect(schema.id).toBeDefined();
      expect(schema.title).toBeDefined();
      expect(schema.properties).toBeDefined();
      expect(typeof schema.properties).toBe("object");

      const propertyNames = Object.keys(schema.properties);
      expect(propertyNames.length).toBeGreaterThan(0);

      const titleProp = Object.values(schema.properties).find((p) => p.type === "title");
      expect(titleProp).toBeDefined();
    });
  });

  describe("createPage with dataSourceId parent", () => {
    it("creates a page in a data source with title only", async () => {
      const page = await client.createPage({
        parent: { dataSourceId: testDb.dataSourceId },
        title: `Test DB Page ${Date.now()}`,
      });

      createdPageIds.push(page.id);

      expect(page.id).toBeDefined();
      expect(page.title).toContain("Test DB Page");
      expect(page.createdTime).toBeDefined();
    });

    it("creates a page in a data source with properties", async () => {
      const page = await client.createPage({
        parent: { dataSourceId: testDb.dataSourceId },
        title: `Test DB Page With Props ${Date.now()}`,
        properties: {
          Status: "In Progress",
          Priority: 5,
          Done: false,
          Notes: "Test notes content",
        },
      });

      createdPageIds.push(page.id);

      expect(page.id).toBeDefined();
      expect(page.title).toContain("Test DB Page With Props");
    });

    it("creates a page with date property", async () => {
      const dueDate = "2025-03-15";
      const page = await client.createPage({
        parent: { dataSourceId: testDb.dataSourceId },
        title: `Test DB Page With Date ${Date.now()}`,
        properties: {
          "Due Date": dueDate,
        },
      });

      createdPageIds.push(page.id);

      expect(page.id).toBeDefined();
    });

    it("creates a page with checkbox property", async () => {
      const page = await client.createPage({
        parent: { dataSourceId: testDb.dataSourceId },
        title: `Test DB Page Checked ${Date.now()}`,
        properties: {
          Done: true,
        },
      });

      createdPageIds.push(page.id);

      expect(page.id).toBeDefined();
    });
  });

  describe("queryDataSource", () => {
    it("queries pages from a data source", async () => {
      const result = await client.queryDataSource({
        dataSourceId: testDb.dataSourceId,
        pageSize: 10,
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.hasMore).toBe("boolean");
    });

    it("queries with sorting", async () => {
      const result = await client.queryDataSource({
        dataSourceId: testDb.dataSourceId,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        pageSize: 5,
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBeLessThanOrEqual(5);
    });

    it("queries and returns pages with properties", async () => {
      const uniqueTitle = `Props Test ${Date.now()}`;
      const created = await client.createPage({
        parent: { dataSourceId: testDb.dataSourceId },
        title: uniqueTitle,
        properties: {
          Priority: 42,
          Done: true,
          Notes: "Some notes here",
        },
      });
      createdPageIds.push(created.id);

      const result = await client.queryDataSource({
        dataSourceId: testDb.dataSourceId,
        pageSize: 100,
      });

      expect(result.results.length).toBeGreaterThan(0);
      const found = result.results.find((p) => p.title === uniqueTitle);
      expect(found).toBeDefined();
      if (found) {
        expect(found.properties).toBeDefined();
      }
    });
  });

  describe("updatePage with data source properties", () => {
    it("updates properties on a database page", async () => {
      const created = await client.createPage({
        parent: { dataSourceId: testDb.dataSourceId },
        title: `Update Props Test ${Date.now()}`,
        properties: {
          Priority: 1,
          Done: false,
        },
      });
      createdPageIds.push(created.id);

      const updated = await client.updatePage({
        pageId: created.id,
        properties: {
          Priority: 10,
          Done: true,
        },
      });

      expect(updated.id).toBe(created.id);
    });

    it("updates title and properties together", async () => {
      const created = await client.createPage({
        parent: { dataSourceId: testDb.dataSourceId },
        title: "Original DB Title",
        properties: {
          Priority: 5,
        },
      });
      createdPageIds.push(created.id);

      const updated = await client.updatePage({
        pageId: created.id,
        title: "Updated DB Title",
        properties: {
          Priority: 99,
        },
      });

      expect(updated.title).toBe("Updated DB Title");
    });
  });

  describe("getPage for data source pages", () => {
    it("retrieves a database page with content", async () => {
      const created = await client.createPage({
        parent: { dataSourceId: testDb.dataSourceId },
        title: `Get Page Test ${Date.now()}`,
        content: "Content inside a database page.",
      });
      createdPageIds.push(created.id);

      const fetched = await client.getPage(created.id, { includeContent: true });

      expect(fetched.id).toBe(created.id);
      expect(fetched.content).toContain("Content inside a database page");
    });
  });
});

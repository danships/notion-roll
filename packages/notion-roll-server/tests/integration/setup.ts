import { createServer } from "../../src/server.js";
import type { Server } from "node:http";

export function getTestConfig() {
  const apiKey = process.env["NOTION_API_KEY"];
  const parentPageId = process.env["NOTION_TEST_PARENT_PAGE"];

  if (!apiKey) {
    throw new Error("NOTION_API_KEY environment variable is required");
  }

  if (!parentPageId) {
    throw new Error("NOTION_TEST_PARENT_PAGE environment variable is required");
  }

  return { apiKey, parentPageId };
}

export interface TestDatabase {
  databaseId: string;
  dataSourceId: string;
  cleanup: () => Promise<void>;
}

export async function createTestDatabase(
  baseUrl: string,
  apiKey: string,
  parentPageId: string
): Promise<TestDatabase> {
  const response = await fetch(`${baseUrl}/api/databases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      parentPageId,
      title: `Server Test Database ${Date.now()}`,
      properties: {
        Name: { title: {} },
        Status: {
          select: {
            options: [
              { name: "Not Started", color: "gray" },
              { name: "In Progress", color: "blue" },
              { name: "Done", color: "green" },
            ],
          },
        },
        Priority: { number: {} },
        Done: { checkbox: {} },
        "Due Date": { date: {} },
        Notes: { rich_text: {} },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create test database: ${error}`);
  }

  const database = await response.json();

  const dsResponse = await fetch(`${baseUrl}/api/databases/${database.id}/data-sources`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const dsData = await dsResponse.json();

  if (!dsData.dataSources || dsData.dataSources.length === 0) {
    throw new Error("Created database has no data sources");
  }

  return {
    databaseId: database.id,
    dataSourceId: dsData.dataSources[0].id,
    cleanup: async () => {
      try {
        await fetch(`${baseUrl}/api/databases/${database.id}/archive`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

export async function startTestServer(port = 0): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer();

  return new Promise((resolve) => {
    server.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      resolve({
        server,
        baseUrl: `http://localhost:${actualPort}`,
      });
    });
  });
}

export function stopTestServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

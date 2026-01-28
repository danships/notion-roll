import { NotionRoll } from "../../src/index.js";
import { ApiClient } from "../../src/api/client.js";
import {
  createDatabase,
  archiveDatabase,
  getDataSources,
} from "../../src/api/databases.js";

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

export function createTestClient() {
  const { apiKey } = getTestConfig();
  return new NotionRoll({ apiKey });
}

export interface TestDatabase {
  databaseId: string;
  dataSourceId: string;
  cleanup: () => Promise<void>;
}

export async function createTestDatabase(parentPageId: string): Promise<TestDatabase> {
  const { apiKey } = getTestConfig();
  const api = new ApiClient({ apiKey });

  const database = await createDatabase(api, {
    parent: { page_id: parentPageId },
    title: `Test Database ${Date.now()}`,
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
  });

  const dataSources = await getDataSources(api, database.id);
  if (dataSources.length === 0) {
    throw new Error("Created database has no data sources");
  }

  return {
    databaseId: database.id,
    dataSourceId: dataSources[0].id,
    cleanup: async () => {
      try {
        await archiveDatabase(api, database.id);
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

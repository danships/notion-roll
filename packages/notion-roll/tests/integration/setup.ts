import { NotionRoll } from "../../src/index.js";

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

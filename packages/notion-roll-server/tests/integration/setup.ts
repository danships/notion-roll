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

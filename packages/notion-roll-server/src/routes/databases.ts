import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseQueryRequest } from "notion-roll";
import {
  parseJsonBody,
  sendJson,
  sendError,
  handleError,
  getNotionClient,
} from "../utils.js";

interface QueryDataSourceBody {
  filter?: Record<string, unknown>;
  sorts?: Array<{
    property?: string;
    timestamp?: "created_time" | "last_edited_time";
    direction: "ascending" | "descending";
  }>;
  pageSize?: number;
  startCursor?: string;
}

export async function handleDatabases(
  req: IncomingMessage,
  res: ServerResponse,
  path: string
): Promise<void> {
  const method = req.method ?? "GET";

  try {
    const client = getNotionClient(req);

    // Match /api/databases/:id/query
    const queryMatch = /^\/api\/databases\/([^/]+)\/query$/.exec(path);
    if (queryMatch && method === "POST") {
      const dataSourceId = queryMatch[1]!;
      const body = await parseJsonBody<QueryDataSourceBody>(req);

      const request: DatabaseQueryRequest = {
        dataSourceId,
        filter: body.filter,
        sorts: body.sorts,
        pageSize: body.pageSize,
        startCursor: body.startCursor,
      };

      const result = await client.queryDataSource(request);
      sendJson(res, 200, result);
      return;
    }

    // Match /api/databases/:id/schema
    const schemaMatch = /^\/api\/databases\/([^/]+)\/schema$/.exec(path);
    if (schemaMatch && method === "GET") {
      const dataSourceId = schemaMatch[1]!;
      const schema = await client.getDataSourceSchema(dataSourceId);
      sendJson(res, 200, schema);
      return;
    }

    // Match /api/databases/:id/data-sources
    const dataSourcesMatch = /^\/api\/databases\/([^/]+)\/data-sources$/.exec(path);
    if (dataSourcesMatch && method === "GET") {
      const databaseId = dataSourcesMatch[1]!;
      const dataSources = await client.getDataSources(databaseId);
      sendJson(res, 200, { dataSources });
      return;
    }

    sendError(res, 404, "Not found");
  } catch (error) {
    handleError(res, error);
  }
}

import type { IncomingMessage, ServerResponse } from "node:http";

export async function handleDatabases(
  req: IncomingMessage,
  res: ServerResponse,
  path: string
): Promise<void> {
  const method = req.method ?? "GET";

  // Match /api/databases/:id/query
  const queryMatch = /^\/api\/databases\/([^/]+)\/query$/.exec(path);

  // POST /api/databases/:id/query - Query database
  if (queryMatch && method === "POST") {
    const _databaseId = queryMatch[1];
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not implemented" }));
    return;
  }

  // Match /api/databases/:id/schema
  const schemaMatch = /^\/api\/databases\/([^/]+)\/schema$/.exec(path);

  // GET /api/databases/:id/schema - Get database schema
  if (schemaMatch && method === "GET") {
    const _databaseId = schemaMatch[1];
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not implemented" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

import type { IncomingMessage, ServerResponse } from "node:http";

export async function handlePages(
  req: IncomingMessage,
  res: ServerResponse,
  path: string
): Promise<void> {
  const method = req.method ?? "GET";

  // POST /api/pages - Create page
  if (path === "/api/pages" && method === "POST") {
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not implemented" }));
    return;
  }

  // Match /api/pages/:id patterns
  const pageIdMatch = /^\/api\/pages\/([^/]+)$/.exec(path);
  const archiveMatch = /^\/api\/pages\/([^/]+)\/archive$/.exec(path);

  // POST /api/pages/:id/archive - Archive page
  if (archiveMatch && method === "POST") {
    const _pageId = archiveMatch[1];
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not implemented" }));
    return;
  }

  // GET /api/pages/:id - Get page
  if (pageIdMatch && method === "GET") {
    const _pageId = pageIdMatch[1];
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not implemented" }));
    return;
  }

  // PATCH /api/pages/:id - Update page
  if (pageIdMatch && method === "PATCH") {
    const _pageId = pageIdMatch[1];
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not implemented" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}

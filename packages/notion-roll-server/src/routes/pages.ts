import type { IncomingMessage, ServerResponse } from "node:http";
import type { PageCreateRequest, PageUpdateRequest, ParentRef } from "notion-roll";
import {
  parseJsonBody,
  sendJson,
  sendError,
  handleError,
  getNotionClient,
} from "../utils.js";

interface CreatePageBody {
  parent: ParentRef;
  title: string;
  content?: string;
  properties?: Record<string, unknown>;
}

interface UpdatePageBody {
  title?: string;
  content?: string;
  contentMode?: "replace" | "append";
  properties?: Record<string, unknown>;
}

export async function handlePages(
  req: IncomingMessage,
  res: ServerResponse,
  path: string
): Promise<void> {
  const method = req.method ?? "GET";

  try {
    const client = getNotionClient(req);

    // POST /api/pages - Create page
    if (path === "/api/pages" && method === "POST") {
      const body = await parseJsonBody<CreatePageBody>(req);

      if (!body.parent || !body.title) {
        sendError(res, 400, "Missing required fields: parent, title");
        return;
      }

      const request: PageCreateRequest = {
        parent: body.parent,
        title: body.title,
        content: body.content,
        properties: body.properties,
      };

      const page = await client.createPage(request);
      sendJson(res, 201, page);
      return;
    }

    // Match /api/pages/:id/archive
    const archiveMatch = /^\/api\/pages\/([^/]+)\/archive$/.exec(path);
    if (archiveMatch && method === "POST") {
      const pageId = archiveMatch[1]!;
      const page = await client.archivePage(pageId);
      sendJson(res, 200, page);
      return;
    }

    // Match /api/pages/:id
    const pageIdMatch = /^\/api\/pages\/([^/]+)$/.exec(path);
    if (!pageIdMatch) {
      sendError(res, 404, "Not found");
      return;
    }

    const pageId = pageIdMatch[1]!;

    // GET /api/pages/:id - Get page
    if (method === "GET") {
      const page = await client.getPage(pageId, { includeContent: true });
      sendJson(res, 200, page);
      return;
    }

    // PATCH /api/pages/:id - Update page
    if (method === "PATCH") {
      const body = await parseJsonBody<UpdatePageBody>(req);

      const request: PageUpdateRequest = {
        pageId,
        title: body.title,
        content: body.content,
        contentMode: body.contentMode,
        properties: body.properties,
      };

      const page = await client.updatePage(request);
      sendJson(res, 200, page);
      return;
    }

    sendError(res, 405, "Method not allowed");
  } catch (error) {
    handleError(res, error);
  }
}

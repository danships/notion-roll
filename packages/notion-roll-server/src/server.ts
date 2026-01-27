import { createServer as createHttpServer, type Server } from "node:http";
import { handlePages } from "./routes/pages.js";
import { handleDatabases } from "./routes/databases.js";
import { handleHealth } from "./routes/health.js";
import { sendError, handleError } from "./utils.js";

export function createServer(): Server {
  return createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const path = url.pathname;

    // CORS headers for development
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      if (path === "/health") {
        return handleHealth(req, res);
      }

      if (path.startsWith("/api/pages")) {
        return await handlePages(req, res, path);
      }

      if (path.startsWith("/api/databases")) {
        return await handleDatabases(req, res, path);
      }

      sendError(res, 404, "Not found");
    } catch (error) {
      handleError(res, error);
    }
  });
}

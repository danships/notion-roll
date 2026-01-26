import { createServer as createHttpServer, type Server } from "node:http";
import { handlePages } from "./routes/pages.js";
import { handleDatabases } from "./routes/databases.js";
import { handleHealth } from "./routes/health.js";

export function createServer(): Server {
  return createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const path = url.pathname;

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

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      console.error("Request error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  });
}

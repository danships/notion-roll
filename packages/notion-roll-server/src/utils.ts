import type { IncomingMessage, ServerResponse } from "node:http";
import { NotionRoll, NotionRollError } from "notion-roll";

export async function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? (JSON.parse(body) as T) : ({} as T));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { error: message });
}

export function handleError(res: ServerResponse, error: unknown): void {
  if (error instanceof NotionRollError) {
    sendJson(res, error.status, {
      error: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  if (error instanceof Error) {
    if (error.message === "Invalid JSON body") {
      sendError(res, 400, error.message);
      return;
    }
    console.error("Unexpected error:", error);
    sendError(res, 500, "Internal server error");
    return;
  }

  console.error("Unknown error:", error);
  sendError(res, 500, "Internal server error");
}

export function getNotionClient(req: IncomingMessage): NotionRoll {
  const authHeader = req.headers.authorization;
  let apiKey: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    apiKey = authHeader.slice(7);
  } else {
    apiKey = process.env["NOTION_API_KEY"];
  }

  if (!apiKey) {
    throw new NotionRollError(
      "Missing API key. Provide Authorization header or set NOTION_API_KEY env var.",
      401,
      "unauthorized"
    );
  }

  return new NotionRoll({ apiKey });
}

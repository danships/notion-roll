import { NotionRollError } from "../types.js";
import type { NotionApiError } from "./types.js";

const DEFAULT_BASE_URL = "https://api.notion.com/v1";
const DEFAULT_NOTION_VERSION = "2025-09-03";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export interface ApiClientConfig {
  apiKey: string;
  baseUrl?: string;
  notionVersion?: string;
}

export class ApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly notionVersion: string;

  constructor(config: ApiClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.notionVersion = config.notionVersion ?? DEFAULT_NOTION_VERSION;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Notion-Version": this.notionVersion,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 429) {
      if (retryCount >= MAX_RETRIES) {
        throw new NotionRollError(
          "Rate limit exceeded after max retries",
          429,
          "rate_limited"
        );
      }

      const retryAfter = response.headers.get("Retry-After");
      const delayMs = retryAfter
        ? Number.parseInt(retryAfter, 10) * 1000
        : INITIAL_RETRY_DELAY_MS * 2 ** retryCount;

      await this.sleep(delayMs);
      return this.request<T>(method, path, body, retryCount + 1);
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as Partial<NotionApiError>;
      throw new NotionRollError(
        errorBody.message ?? `Request failed with status ${response.status}`,
        response.status,
        errorBody.code ?? "unknown_error",
        errorBody
      );
    }

    return response.json() as Promise<T>;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

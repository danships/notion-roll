export interface NotionRollConfig {
  apiKey: string;
  baseUrl?: string;
  notionVersion?: string;
}

export type ParentRef = { pageId: string } | { databaseId: string };

export interface PageCreateRequest {
  parent: ParentRef;
  title: string;
  content?: string;
  properties?: Record<string, unknown>;
}

export interface PageUpdateRequest {
  pageId: string;
  title?: string;
  content?: string;
  contentMode?: "replace" | "append";
  properties?: Record<string, unknown>;
}

export interface PageResponse {
  id: string;
  title: string;
  content: string;
  properties: Record<string, unknown>;
  createdTime: string;
  lastEditedTime: string;
}

export interface Paginated<T> {
  results: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface DatabaseQueryRequest {
  databaseId: string;
  filter?: NotionFilter;
  sorts?: NotionSort[];
  pageSize?: number;
  startCursor?: string;
}

export interface DatabaseSchema {
  id: string;
  title: string;
  properties: Record<string, PropertySchema>;
}

export interface PropertySchema {
  id: string;
  name: string;
  type: string;
  config?: unknown;
}

// Pass-through Notion types (minimal typing for now)
export type NotionFilter = Record<string, unknown>;
export type NotionSort = {
  property?: string;
  timestamp?: "created_time" | "last_edited_time";
  direction: "ascending" | "descending";
};

export class NotionRollError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "NotionRollError";
  }
}

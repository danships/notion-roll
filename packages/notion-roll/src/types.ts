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
  type: PropertyType;
  config?: unknown;
}

// Property types supported for writing
export const WRITABLE_PROPERTY_TYPES = [
  "title",
  "rich_text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "checkbox",
  "url",
  "email",
  "phone_number",
] as const;

export type WritablePropertyType = (typeof WRITABLE_PROPERTY_TYPES)[number];

// Property types that are read-only (returned as raw Notion format)
export const READ_ONLY_PROPERTY_TYPES = [
  "people",
  "files",
  "relation",
  "rollup",
  "formula",
  "created_time",
  "created_by",
  "last_edited_time",
  "last_edited_by",
  "unique_id",
  "verification",
] as const;

export type ReadOnlyPropertyType = (typeof READ_ONLY_PROPERTY_TYPES)[number];

export type PropertyType = WritablePropertyType | ReadOnlyPropertyType;

// Supported markdown features for conversion
export const SUPPORTED_MARKDOWN_FEATURES = {
  blocks: [
    "heading_1",
    "heading_2",
    "heading_3",
    "paragraph",
    "bulleted_list_item",
    "numbered_list_item",
    "code",
    "quote",
    "divider",
    "image",
  ],
  inline: ["bold", "italic", "strikethrough", "code", "link"],
} as const;

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

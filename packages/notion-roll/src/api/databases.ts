import type { ApiClient } from "./client.js";
import type { NotionDatabase, NotionDataSource } from "./types.js";

export interface CreateDatabaseOptions {
  parent: { page_id: string };
  title: string;
  properties: Record<string, unknown>;
}

export async function createDatabase(
  api: ApiClient,
  options: CreateDatabaseOptions
): Promise<NotionDatabase> {
  return api.post<NotionDatabase>("/databases", {
    parent: { type: "page_id", ...options.parent },
    title: [{ type: "text", text: { content: options.title } }],
    initial_data_source: {
      properties: options.properties,
    },
  });
}

export async function getDatabase(
  api: ApiClient,
  databaseId: string
): Promise<NotionDatabase> {
  return api.get<NotionDatabase>(`/databases/${databaseId}`);
}

export async function archiveDatabase(
  api: ApiClient,
  databaseId: string
): Promise<NotionDatabase> {
  return api.patch<NotionDatabase>(`/databases/${databaseId}`, { archived: true });
}

export async function getDataSources(
  api: ApiClient,
  databaseId: string
): Promise<NotionDataSource[]> {
  const database = await getDatabase(api, databaseId);
  return database.data_sources ?? [];
}

export async function getDataSource(
  api: ApiClient,
  dataSourceId: string
): Promise<NotionDataSource> {
  return api.get<NotionDataSource>(`/data_sources/${dataSourceId}`);
}

export interface QueryDataSourceOptions {
  filter?: Record<string, unknown>;
  sorts?: Array<{
    property?: string;
    timestamp?: "created_time" | "last_edited_time";
    direction: "ascending" | "descending";
  }>;
  page_size?: number;
  start_cursor?: string;
}

export interface QueryDataSourceResponse {
  object: "list";
  results: Array<{
    object: "page";
    id: string;
    [key: string]: unknown;
  }>;
  next_cursor: string | null;
  has_more: boolean;
}

export async function queryDataSource(
  api: ApiClient,
  dataSourceId: string,
  options: QueryDataSourceOptions = {}
): Promise<QueryDataSourceResponse> {
  return api.post<QueryDataSourceResponse>(
    `/data_sources/${dataSourceId}/query`,
    options
  );
}

export async function updateDataSource(
  api: ApiClient,
  dataSourceId: string,
  updates: {
    properties?: Record<string, unknown>;
    title?: string;
    in_trash?: boolean;
  }
): Promise<NotionDataSource> {
  return api.patch<NotionDataSource>(`/data_sources/${dataSourceId}`, updates);
}

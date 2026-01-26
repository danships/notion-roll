import type { ApiClient } from "./client.js";
import type { NotionPage } from "./types.js";

export async function getPageMeta(
  api: ApiClient,
  pageId: string
): Promise<NotionPage> {
  return api.get<NotionPage>(`/pages/${pageId}`);
}

export async function updatePageProperties(
  api: ApiClient,
  pageId: string,
  properties: Record<string, unknown>
): Promise<NotionPage> {
  return api.patch<NotionPage>(`/pages/${pageId}`, { properties });
}

export async function archivePage(
  api: ApiClient,
  pageId: string
): Promise<NotionPage> {
  return api.patch<NotionPage>(`/pages/${pageId}`, { archived: true });
}

export async function createPage(
  api: ApiClient,
  parent: { page_id: string } | { data_source_id: string },
  properties: Record<string, unknown>,
  children?: unknown[]
): Promise<NotionPage> {
  return api.post<NotionPage>("/pages", {
    parent,
    properties,
    children,
  });
}

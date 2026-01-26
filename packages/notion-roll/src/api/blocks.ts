import type { ApiClient } from "./client.js";
import type { NotionBlock, NotionBlocksResponse } from "./types.js";

export async function listBlockChildren(
  api: ApiClient,
  blockId: string,
  cursor?: string
): Promise<NotionBlocksResponse> {
  const params = cursor ? `?start_cursor=${cursor}` : "";
  return api.get<NotionBlocksResponse>(`/blocks/${blockId}/children${params}`);
}

export async function listAllBlockChildren(
  api: ApiClient,
  blockId: string,
  recursive = false
): Promise<NotionBlock[]> {
  const allBlocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response = await listBlockChildren(api, blockId, cursor);
    allBlocks.push(...response.results);
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  if (recursive) {
    for (const block of allBlocks) {
      if (block["has_children"] && block.id) {
        const children = await listAllBlockChildren(api, block.id, true);
        block["children"] = children;
      }
    }
  }

  return allBlocks;
}

export async function appendBlockChildren(
  api: ApiClient,
  blockId: string,
  children: NotionBlock[]
): Promise<NotionBlocksResponse> {
  return api.patch<NotionBlocksResponse>(`/blocks/${blockId}/children`, {
    children,
  });
}

export async function deleteBlock(
  api: ApiClient,
  blockId: string
): Promise<NotionBlock> {
  return api.delete<NotionBlock>(`/blocks/${blockId}`);
}

export async function deleteBlockChildren(
  api: ApiClient,
  blockId: string
): Promise<void> {
  const blocks = await listBlockChildren(api, blockId);

  for (const block of blocks.results) {
    if (block.id) {
      await deleteBlock(api, block.id);
    }
  }

  // Handle pagination - continue deleting if there are more blocks
  if (blocks.has_more && blocks.next_cursor) {
    await deleteBlockChildren(api, blockId);
  }
}

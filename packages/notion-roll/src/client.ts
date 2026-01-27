import { ApiClient } from "./api/client.js";
import * as pages from "./api/pages.js";
import * as blocks from "./api/blocks.js";
import * as databases from "./api/databases.js";
import { markdownToNotionBlocks } from "./markdown/to-blocks.js";
import { blocksToMarkdown } from "./markdown/from-blocks.js";
import { toNotionProperties, fromNotionProperties } from "./properties/index.js";
import { SchemaCache } from "./properties/schema-cache.js";
import type {
  NotionRollConfig,
  PageCreateRequest,
  PageUpdateRequest,
  PageResponse,
  Paginated,
  DatabaseQueryRequest,
  DatabaseSchema,
  DataSourceInfo,
} from "./types.js";
import type { NotionBlock, NotionPage } from "./api/types.js";

export class NotionRoll {
  private readonly api: ApiClient;
  private readonly schemaCache: SchemaCache;

  constructor(config: NotionRollConfig) {
    this.api = new ApiClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      notionVersion: config.notionVersion,
    });
    this.schemaCache = new SchemaCache(this.api);
  }

  async createPage(request: PageCreateRequest): Promise<PageResponse> {
    const parent = "pageId" in request.parent
      ? { page_id: request.parent.pageId }
      : { data_source_id: request.parent.dataSourceId };

    // Convert markdown content to blocks
    const children = request.content
      ? markdownToNotionBlocks(request.content)
      : [];

    // Build properties with title
    let properties: Record<string, unknown> = {
      title: {
        title: [{ type: "text", text: { content: request.title } }],
      },
    };

    // Convert additional properties if we have a data source parent
    if ("dataSourceId" in request.parent && request.properties) {
      const schema = await this.schemaCache.getSchema(request.parent.dataSourceId);
      const convertedProps = toNotionProperties(request.properties, schema.properties);
      properties = { ...properties, ...convertedProps };
    }

    const notionPage = await pages.createPage(
      this.api,
      parent,
      properties,
      children as unknown[]
    );

    return this.convertPageResponse(notionPage, request.content ?? "");
  }

  async getPage(
    pageId: string,
    options?: { includeContent?: boolean }
  ): Promise<PageResponse> {
    const notionPage = await pages.getPageMeta(this.api, pageId);

    let content = "";
    if (options?.includeContent !== false) {
      const pageBlocks = await blocks.listAllBlockChildren(this.api, pageId, true);
      content = blocksToMarkdown(pageBlocks);
    }

    return this.convertPageResponse(notionPage, content);
  }

  async updatePage(request: PageUpdateRequest): Promise<PageResponse> {
    // Update properties if provided
    if (request.properties || request.title) {
      const propertiesToUpdate: Record<string, unknown> = {};

      if (request.title) {
        propertiesToUpdate["title"] = {
          title: [{ type: "text", text: { content: request.title } }],
        };
      }

      if (request.properties) {
        // Try to get schema from parent if it's a database page
        const page = await pages.getPageMeta(this.api, request.pageId);
        if (page.parent.type === "data_source_id") {
          const dataSourceId = (page.parent as { data_source_id: string }).data_source_id;
          const schema = await this.schemaCache.getSchema(dataSourceId);
          const convertedProps = toNotionProperties(request.properties, schema.properties);
          Object.assign(propertiesToUpdate, convertedProps);
        }
      }

      if (Object.keys(propertiesToUpdate).length > 0) {
        await pages.updatePageProperties(this.api, request.pageId, propertiesToUpdate);
      }
    }

    // Update content if provided
    if (request.content !== undefined) {
      const newBlocks = markdownToNotionBlocks(request.content);

      if (request.contentMode === "append") {
        await blocks.appendBlockChildren(
          this.api,
          request.pageId,
          newBlocks as NotionBlock[]
        );
      } else {
        // Replace mode - delete existing blocks first
        await blocks.deleteBlockChildren(this.api, request.pageId);
        if (newBlocks.length > 0) {
          await blocks.appendBlockChildren(
            this.api,
            request.pageId,
            newBlocks as NotionBlock[]
          );
        }
      }
    }

    // Fetch and return updated page
    return this.getPage(request.pageId, { includeContent: true });
  }

  async archivePage(pageId: string): Promise<PageResponse> {
    const notionPage = await pages.archivePage(this.api, pageId);
    return this.convertPageResponse(notionPage, "");
  }

  // Database/Data Source operations (API 2025-09-03)

  async queryDataSource(
    request: DatabaseQueryRequest
  ): Promise<Paginated<PageResponse>> {
    const response = await databases.queryDataSource(this.api, request.dataSourceId, {
      filter: request.filter,
      sorts: request.sorts,
      page_size: request.pageSize,
      start_cursor: request.startCursor,
    });

    const schema = await this.schemaCache.getSchema(request.dataSourceId);

    const results = await Promise.all(
      response.results.map(async (page) => {
        const notionPage = page as unknown as NotionPage;
        return this.convertPageResponse(notionPage, "", schema);
      })
    );

    return {
      results,
      nextCursor: response.next_cursor ?? undefined,
      hasMore: response.has_more,
    };
  }

  async getDataSourceSchema(dataSourceId: string): Promise<DatabaseSchema> {
    return this.schemaCache.getSchema(dataSourceId);
  }

  async getDataSources(databaseId: string): Promise<DataSourceInfo[]> {
    const dataSources = await databases.getDataSources(this.api, databaseId);
    return dataSources.map((ds) => ({
      id: ds.id,
      type: ds.type,
    }));
  }

  private convertPageResponse(
    notionPage: NotionPage,
    content: string,
    schema?: DatabaseSchema
  ): PageResponse {
    let properties: Record<string, unknown> = {};
    let title = "";

    // Extract title from properties
    for (const [name, prop] of Object.entries(notionPage.properties)) {
      const propValue = prop as { type: string; title?: Array<{ plain_text: string }> };
      if (propValue.type === "title" && propValue.title) {
        title = propValue.title.map((t) => t.plain_text).join("");
        break;
      }
    }

    // Convert properties
    if (schema) {
      properties = fromNotionProperties(notionPage.properties, schema.properties);
    } else {
      properties = notionPage.properties;
    }

    return {
      id: notionPage.id,
      title,
      content,
      properties,
      createdTime: notionPage.created_time,
      lastEditedTime: notionPage.last_edited_time,
    };
  }
}

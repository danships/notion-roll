import { ApiClient } from "./api/client.js";
import * as pages from "./api/pages.js";
import * as blocks from "./api/blocks.js";
import * as databases from "./api/databases.js";
import { markdownToNotionBlocks } from "./markdown/to-blocks.js";
import { blocksToMarkdown } from "./markdown/from-blocks.js";
import { toNotionProperties, fromNotionProperties } from "./properties/index.js";
import { SchemaCache } from "./properties/schema-cache.js";
import {
  validateConfig,
  validatePageCreateRequest,
  validatePageUpdateRequest,
  validateDatabaseQueryRequest,
} from "./validation.js";
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
    const validatedConfig = validateConfig(config);
    this.api = new ApiClient({
      apiKey: validatedConfig.apiKey,
      baseUrl: validatedConfig.baseUrl,
      notionVersion: validatedConfig.notionVersion,
    });
    this.schemaCache = new SchemaCache(this.api);
  }

  async createPage(request: PageCreateRequest): Promise<PageResponse> {
    const validatedRequest = validatePageCreateRequest(request);
    const parent = "pageId" in validatedRequest.parent
      ? { page_id: validatedRequest.parent.pageId }
      : { data_source_id: validatedRequest.parent.dataSourceId };

    // Convert markdown content to blocks
    const children = validatedRequest.content
      ? markdownToNotionBlocks(validatedRequest.content)
      : [];

    // Build properties with title
    let properties: Record<string, unknown> = {
      title: {
        title: [{ type: "text", text: { content: validatedRequest.title } }],
      },
    };

    // Convert additional properties if we have a data source parent
    if ("dataSourceId" in validatedRequest.parent && validatedRequest.properties) {
      const schema = await this.schemaCache.getSchema(validatedRequest.parent.dataSourceId);
      const convertedProps = toNotionProperties(validatedRequest.properties, schema.properties);
      properties = { ...properties, ...convertedProps };
    }

    const notionPage = await pages.createPage(
      this.api,
      parent,
      properties,
      children as unknown[]
    );

    return this.convertPageResponse(notionPage, validatedRequest.content ?? "");
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
    const validatedRequest = validatePageUpdateRequest(request);
    
    // Update properties if provided
    if (validatedRequest.properties || validatedRequest.title) {
      const propertiesToUpdate: Record<string, unknown> = {};

      if (validatedRequest.title) {
        propertiesToUpdate["title"] = {
          title: [{ type: "text", text: { content: validatedRequest.title } }],
        };
      }

      if (validatedRequest.properties) {
        // Try to get schema from parent if it's a database page
        const page = await pages.getPageMeta(this.api, validatedRequest.pageId);
        if (page.parent.type === "data_source_id") {
          const dataSourceId = (page.parent as { data_source_id: string }).data_source_id;
          const schema = await this.schemaCache.getSchema(dataSourceId);
          const convertedProps = toNotionProperties(validatedRequest.properties, schema.properties);
          Object.assign(propertiesToUpdate, convertedProps);
        }
      }

      if (Object.keys(propertiesToUpdate).length > 0) {
        await pages.updatePageProperties(this.api, validatedRequest.pageId, propertiesToUpdate);
      }
    }

    // Update content if provided
    if (validatedRequest.content !== undefined) {
      const newBlocks = markdownToNotionBlocks(validatedRequest.content);

      if (validatedRequest.contentMode === "append") {
        await blocks.appendBlockChildren(
          this.api,
          validatedRequest.pageId,
          newBlocks as NotionBlock[]
        );
      } else {
        // Replace mode - delete existing blocks first
        await blocks.deleteBlockChildren(this.api, validatedRequest.pageId);
        if (newBlocks.length > 0) {
          await blocks.appendBlockChildren(
            this.api,
            validatedRequest.pageId,
            newBlocks as NotionBlock[]
          );
        }
      }
    }

    // Fetch and return updated page
    return this.getPage(validatedRequest.pageId, { includeContent: true });
  }

  async archivePage(pageId: string): Promise<PageResponse> {
    const notionPage = await pages.archivePage(this.api, pageId);
    return this.convertPageResponse(notionPage, "");
  }

  // Database/Data Source operations (API 2025-09-03)

  async queryDataSource(
    request: DatabaseQueryRequest
  ): Promise<Paginated<PageResponse>> {
    const validatedRequest = validateDatabaseQueryRequest(request);
    
    const response = await databases.queryDataSource(this.api, validatedRequest.dataSourceId, {
      filter: validatedRequest.filter,
      sorts: validatedRequest.sorts,
      page_size: validatedRequest.pageSize,
      start_cursor: validatedRequest.startCursor,
    });

    const schema = await this.schemaCache.getSchema(validatedRequest.dataSourceId);

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
      type: ds.type ?? "default",
    }));
  }

  async createDatabase(request: {
    parentPageId: string;
    title: string;
    properties: Record<string, unknown>;
  }): Promise<{ id: string; title: string }> {
    const database = await databases.createDatabase(this.api, {
      parent: { page_id: request.parentPageId },
      title: request.title,
      properties: request.properties,
    });
    const title = database.title.map((t) => t.plain_text).join("");
    return { id: database.id, title };
  }

  async archiveDatabase(databaseId: string): Promise<{ id: string }> {
    const database = await databases.archiveDatabase(this.api, databaseId);
    return { id: database.id };
  }

  private convertPageResponse(
    notionPage: NotionPage,
    content: string,
    schema?: DatabaseSchema
  ): PageResponse {
    let properties: Record<string, unknown> = {};
    let title = "";

    // Extract title from properties
    for (const [_name, prop] of Object.entries(notionPage.properties)) {
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

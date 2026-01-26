import { ApiClient } from "./api/client.js";
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

export class NotionRoll {
  private readonly api: ApiClient;

  constructor(config: NotionRollConfig) {
    this.api = new ApiClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      notionVersion: config.notionVersion,
    });
  }

  async createPage(_request: PageCreateRequest): Promise<PageResponse> {
    throw new Error("Not implemented");
  }

  async getPage(
    _pageId: string,
    _options?: { includeContent?: boolean }
  ): Promise<PageResponse> {
    throw new Error("Not implemented");
  }

  async updatePage(_request: PageUpdateRequest): Promise<PageResponse> {
    throw new Error("Not implemented");
  }

  async archivePage(_pageId: string): Promise<PageResponse> {
    throw new Error("Not implemented");
  }

  // Database/Data Source operations (API 2025-09-03)

  async queryDataSource(
    _request: DatabaseQueryRequest
  ): Promise<Paginated<PageResponse>> {
    throw new Error("Not implemented");
  }

  async getDataSourceSchema(_dataSourceId: string): Promise<DatabaseSchema> {
    throw new Error("Not implemented");
  }

  async getDataSources(_databaseId: string): Promise<DataSourceInfo[]> {
    throw new Error("Not implemented");
  }
}

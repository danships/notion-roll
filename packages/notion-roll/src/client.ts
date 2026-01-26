import { ApiClient } from "./api/client.js";
import type {
  NotionRollConfig,
  PageCreateRequest,
  PageUpdateRequest,
  PageResponse,
  Paginated,
  DatabaseQueryRequest,
  DatabaseSchema,
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

  async queryDatabase(
    _request: DatabaseQueryRequest
  ): Promise<Paginated<PageResponse>> {
    throw new Error("Not implemented");
  }

  async getDatabaseSchema(_databaseId: string): Promise<DatabaseSchema> {
    throw new Error("Not implemented");
  }
}

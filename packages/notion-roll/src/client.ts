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
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly notionVersion: string;

  constructor(config: NotionRollConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.notion.com/v1";
    this.notionVersion = config.notionVersion ?? "2022-06-28";
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

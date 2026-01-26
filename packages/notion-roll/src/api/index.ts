export { ApiClient, type ApiClientConfig } from "./client.js";

// Page primitives
export {
  getPageMeta,
  updatePageProperties,
  archivePage,
  createPage,
} from "./pages.js";

// Block primitives
export {
  listBlockChildren,
  listAllBlockChildren,
  appendBlockChildren,
  deleteBlock,
  deleteBlockChildren,
} from "./blocks.js";

// Database/Data Source primitives
export {
  getDatabase,
  getDataSources,
  getDataSource,
  queryDataSource,
  updateDataSource,
  type QueryDataSourceOptions,
  type QueryDataSourceResponse,
} from "./databases.js";

// Types
export type {
  NotionBlock,
  NotionPage,
  NotionParent,
  NotionRichText,
  NotionApiError,
  NotionBlocksResponse,
  NotionDatabase,
  NotionDataSource,
  NotionPropertyConfig,
} from "./types.js";

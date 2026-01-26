# Notion-Roll Monorepo Plan

## Overview

A monorepo containing two packages:
1. **notion-roll** - Node library for simplified Notion API interactions with markdown support
2. **notion-roll-server** - HTTP server exposing the library as REST endpoints

---

## Package 1: notion-roll (Library)

### Core Features

- **Markdown ↔ Notion Blocks**: Convert markdown to Notion block format and vice versa
- **Database Column Handling**: Accept markdown/string/numeric values, auto-convert based on column schema
- **Notion API Proxy**: All requests proxied to Notion API with transformations

### API Design

```typescript
// Core types
interface NotionRollConfig {
  apiKey: string;
  baseUrl?: string;        // defaults to https://api.notion.com/v1
  notionVersion?: string;  // defaults to 2025-09-03
}

// Explicit parent typing (matches Notion API 2025-09-03 semantics)
// Use dataSourceId for database pages (required for multi-source databases)
type ParentRef = { pageId: string } | { dataSourceId: string };

interface PageCreateRequest {
  parent: ParentRef;
  title: string;
  content?: string;        // Markdown body (optional)
  properties?: Record<string, unknown>; // Only valid for database parent
}

interface PageUpdateRequest {
  pageId: string;
  title?: string;
  content?: string;        // Markdown body
  contentMode?: 'replace' | 'append'; // Default: 'replace'
  properties?: Record<string, unknown>;
}

interface PageResponse {
  id: string;
  title: string;
  content: string;         // Markdown body
  properties: Record<string, unknown>;
  createdTime: string;
  lastEditedTime: string;
}

// Pagination support for database queries
interface Paginated<T> {
  results: T[];
  nextCursor?: string;
  hasMore: boolean;
}

interface DatabaseQueryRequest {
  dataSourceId: string;    // Changed from databaseId in API 2025-09-03
  filter?: NotionFilter;   // Pass-through Notion filter type
  sorts?: NotionSort[];    // Pass-through Notion sort type
  pageSize?: number;
  startCursor?: string;
}

// Error handling
class NotionRollError extends Error {
  status: number;
  code: string;
  details?: unknown;
}

// Main class
class NotionRoll {
  constructor(config: NotionRollConfig);
  
  // Page operations
  createPage(request: PageCreateRequest): Promise<PageResponse>;
  getPage(pageId: string, options?: { includeContent?: boolean }): Promise<PageResponse>;
  updatePage(request: PageUpdateRequest): Promise<PageResponse>;
  archivePage(pageId: string): Promise<PageResponse>; // Notion "delete" = archive
  
  // Database/Data Source operations (API 2025-09-03)
  queryDataSource(request: DatabaseQueryRequest): Promise<Paginated<PageResponse>>;
  getDataSourceSchema(dataSourceId: string): Promise<DatabaseSchema>;
  getDataSources(databaseId: string): Promise<DataSourceInfo[]>;
}
```

### Markdown Conversion

**Supported Markdown → Notion Blocks:**
- Headings (h1, h2, h3)
- Paragraphs
- Bullet lists
- Numbered lists
- Code blocks (with language)
- Blockquotes
- Horizontal rules
- Bold, italic, strikethrough, code inline
- Links
- Images

**Notion Blocks → Markdown:**
- Reverse of above
- Unsupported blocks: render as HTML comment with type

### Database Property Conversion

**Write-Supported (v1):**
| Input Type | Notion Property Types |
|------------|----------------------|
| `string`   | title, rich_text, select, multi_select, url, email, phone, status |
| `number`   | number |
| `boolean`  | checkbox |
| `Date/ISO string` | date |
| `markdown` | rich_text (with formatting) |

**Read-Only (returned as raw Notion format):**
- people, files, relation, rollup, formula
- created_time, created_by, last_edited_time, last_edited_by

---

## Package 2: notion-roll-server (HTTP Server)

### Endpoints

```
POST   /api/pages                  - Create page
GET    /api/pages/:id              - Get page (returns markdown body)
PATCH  /api/pages/:id              - Update page
POST   /api/pages/:id/archive      - Archive page (Notion's "delete")

POST   /api/databases/:id/query    - Query database
GET    /api/databases/:id/schema   - Get database schema

GET    /health                     - Health check
```

### Request/Response Format

All endpoints use JSON. Authentication via `Authorization: Bearer <notion-api-key>` header or `NOTION_API_KEY` env var.

**Example: Create Page**
```json
POST /api/pages
{
  "parentId": "abc123",
  "title": "My Page",
  "content": "# Hello\n\nThis is **markdown** content.",
  "properties": {
    "Status": "In Progress",
    "Priority": 1
  }
}
```

**Response:**
```json
{
  "id": "xyz789",
  "title": "My Page",
  "content": "# Hello\n\nThis is **markdown** content.",
  "properties": {
    "Status": "In Progress",
    "Priority": 1
  },
  "createdTime": "2026-01-26T10:00:00Z",
  "lastEditedTime": "2026-01-26T10:00:00Z"
}
```

---

## Monorepo Structure

```
notion-roll/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspace definition
├── tsconfig.base.json        # Shared TypeScript config
├── .gitignore
├── README.md
│
├── packages/
│   ├── notion-roll/          # Library package
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts           # NotionRoll class
│   │   │   ├── markdown/
│   │   │   │   ├── index.ts
│   │   │   │   ├── to-blocks.ts    # MD → Notion blocks
│   │   │   │   └── from-blocks.ts  # Notion blocks → MD
│   │   │   ├── properties/
│   │   │   │   ├── index.ts
│   │   │   │   ├── to-notion.ts    # Values → Notion format
│   │   │   │   └── from-notion.ts  # Notion format → values
│   │   │   ├── api/
│   │   │   │   ├── pages.ts
│   │   │   │   └── databases.ts
│   │   │   └── types.ts
│   │   └── tests/
│   │       ├── integration/
│   │       │   ├── setup.ts        # Test helpers, env config
│   │       │   ├── pages.test.ts
│   │       │   └── databases.test.ts
│   │       └── unit/
│   │           ├── markdown.test.ts
│   │           └── properties.test.ts
│   │
│   └── notion-roll-server/   # Server package
│       ├── package.json
│       ├── tsconfig.json
│       ├── esbuild.config.ts
│       ├── src/
│       │   ├── index.ts            # Entry point
│       │   ├── server.ts           # HTTP server setup
│       │   └── routes/
│       │       ├── pages.ts
│       │       ├── databases.ts
│       │       └── health.ts
│       ├── dist/                   # esbuild output
│       └── tests/
│           └── integration/
│               ├── setup.ts
│               └── api.test.ts
│
└── scripts/
    └── test-integration.sh   # Runs integration tests with API key
```

---

## Implementation Steps

### Phase 1: Project Setup (Steps 1-4)

1. ✅ **Initialize monorepo structure**
   - ✅ Create root `package.json` with pnpm workspaces
   - ✅ Create `pnpm-workspace.yaml`
   - ✅ Create shared `tsconfig.base.json`
   - ✅ Add `.gitignore`, `README.md`
   - ✅ Add root ESLint (with typescript-eslint + unicorn) and Prettier config

2. ✅ **Set up notion-roll package**
   - ✅ Create `packages/notion-roll/package.json` with ESM exports
   - ✅ Create `tsconfig.json` extending base
   - ✅ Set up source directory structure (client, types, markdown/, properties/, api/)
   - ✅ Add vitest configs (unit + integration)
   - ✅ Add test setup with env var handling

3. ✅ **Set up notion-roll-server package**
   - ✅ Create `packages/notion-roll-server/package.json`
   - ✅ Add esbuild config (bundles with notion-roll inlined)
   - ✅ Reference notion-roll as workspace dependency
   - ✅ Create source structure: server.ts, routes/ (pages, databases, health)
   - ✅ Add vitest configs and test setup helpers

4. ✅ **Configure build and test scripts**
   - ✅ Root scripts: build, typecheck, test, test:integration, lint, format, clean
   - ✅ Package-specific scripts with typecheck and clean
   - ✅ Integration test script (scripts/test-integration.sh) requiring env vars

### Phase 2: Core Types & Primitives (Steps 5-7)

5. ✅ **Define core types and constraints**
   - ✅ Define `PageResponse`, `ParentRef`, `NotionRollError`
   - ✅ Define supported property types (WRITABLE_PROPERTY_TYPES, READ_ONLY_PROPERTY_TYPES)
   - ✅ Define supported markdown/block features (SUPPORTED_MARKDOWN_FEATURES)
   - ✅ Export pass-through types for `NotionFilter`/`NotionSort`

6. ✅ **Implement Notion API client wrapper**
   - ✅ HTTP request wrapper using native fetch (ApiClient class)
   - ✅ Include `Authorization`, `Notion-Version` headers (default: 2025-09-03)
   - ✅ Error handling with typed `NotionRollError`
   - ✅ Rate limit handling (429 retry with exponential backoff, max 3 retries)
   - ✅ Updated for Notion API 2025-09-03 (data source support)

7. ✅ **Implement low-level Notion primitives**
   - ✅ `getPageMeta(pageId)` - page metadata only
   - ✅ `listBlockChildren(blockId, cursor?)` - paginated + `listAllBlockChildren` recursive helper
   - ✅ `appendBlockChildren(blockId, children)` - add blocks
   - ✅ `deleteBlockChildren(blockId)` - clear blocks for replace mode
   - ✅ `updatePageProperties(pageId, properties)` - property updates
   - ✅ Database/Data Source primitives: `getDatabase`, `getDataSources`, `queryDataSource`, `updateDataSource`

### Phase 3: Converters (Steps 8-10)

8. ✅ **Implement markdown-to-blocks converter**
   - ✅ Parse markdown using `marked` Lexer
   - ✅ Map to Notion block types: heading_1/2/3, paragraph, code, quote, divider, image
   - ✅ Handle inline formatting (bold, italic, strikethrough, code, links)
   - ✅ Handle code blocks with language mapping
   - ✅ Handle lists (bulleted_list_item, numbered_list_item)
   - ✅ Unsupported: fallback to paragraph with raw text

9. ✅ **Implement blocks-to-markdown converter**
   - ✅ Custom implementation (notion-to-md requires @notionhq/client)
   - ✅ Handle all block types: paragraph, headings, lists, code, quote, divider, image, etc.
   - ✅ Handle nested blocks (lists, toggles, columns)
   - ✅ Handle inline annotations: bold, italic, strikethrough, code, links
   - ✅ Unsupported blocks: render as HTML comment `<!-- notion:type -->`

10. ✅ **Implement property converters**
    - ✅ `SchemaCache` class with in-memory caching for data source schemas
    - ✅ `toNotionProperties` - convert input values to Notion format based on schema
    - ✅ `fromNotionProperties` - convert Notion properties to simple values
    - ✅ Write-supported types: title, rich_text, number, select, multi_select, status, date, checkbox, url, email, phone_number
    - ✅ Read-only types: returned as raw Notion format

### Phase 4: NotionRoll Facade (Step 11)

11. **Implement NotionRoll class**
    - `createPage` - orchestrates property conversion + block append
    - `getPage` - metadata + optional content (block traversal → markdown)
    - `updatePage` - with contentMode (replace/append)
    - `archivePage` - set archived: true
    - `queryDatabase` - with pagination support
    - `getDatabaseSchema` - cached

### Phase 5: Server Implementation (Steps 12-14)

12. **Create HTTP server with routing**
    - Native Node HTTP server
    - Simple path-based routing
    - JSON request/response handling
    - Error middleware with NotionRollError mapping

13. **Implement API routes**
    - Page endpoints (POST, GET, PATCH, POST archive)
    - Database endpoints (POST query, GET schema)
    - Health check endpoint

14. **Configure esbuild bundling**
    - Bundle server with notion-roll inlined
    - Single executable output
    - Source maps for debugging

### Phase 6: Testing (Steps 15-18)

15. **Write unit tests with mocked fetch**
    - Test API client: headers, error mapping, rate limit handling
    - Test request/response formatting
    - Skip Notion dependency for fast CI

16. **Write snapshot tests for converters**
    - Markdown → blocks fixtures
    - Blocks → markdown fixtures
    - Round-trip stability tests

17. **Write integration tests for notion-roll** (opt-in via env vars)
    - Create test container page
    - CRUD operations with verification
    - Database operations
    - Cleanup after tests

18. **Write integration tests for server** (opt-in via env vars)
    - Start server with test config
    - HTTP requests to all endpoints
    - Verify Notion state changes
    - Cleanup

### Phase 7: Documentation (Steps 19-20)

19. **Write comprehensive README**
    - Installation instructions
    - API documentation with examples
    - Configuration options
    - Supported features table
    - Integration test instructions

20. **Add CI configuration (optional)**
    - Unit tests on all PRs
    - Integration tests on protected branches with secrets

---

## Dependencies

### notion-roll
- `marked` - Markdown parsing (for MD → Notion blocks)
- `typescript` - Development

### notion-roll-server
- `notion-roll` (workspace reference)
- `esbuild` - Bundling
- `typescript` - Development

### Shared (dev)
- `vitest` - Testing
- `@types/node` - Node type definitions

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NOTION_API_KEY` | Notion integration API key | Yes |
| `NOTION_TEST_PARENT_PAGE` | Parent page ID for integration tests | For tests |
| `PORT` | Server port (default: 3000) | No |

---

## Integration Test Strategy

Tests require:
1. A Notion API key with access to a workspace
2. A parent page ID where tests can create/delete content

Test flow:
1. Create a test container page under parent
2. Run all tests creating content under container
3. Delete container page (cleanup)

Run with:
```bash
NOTION_API_KEY=secret_xxx NOTION_TEST_PARENT_PAGE=abc123 pnpm test:integration
```

---

## Scope & Limitations (v1)

### Supported Markdown Features
- Headings (h1-h3), paragraphs, bold, italic, strikethrough, inline code
- Bullet lists, numbered lists (single level)
- Code blocks with language
- Blockquotes, horizontal rules
- Links, images (URL only, no upload)

### Not Supported in v1
- Tables, to-dos, toggles, callouts
- Nested lists beyond 1 level
- Equations, embeds, synced blocks
- File uploads (images must be URLs)
- Bidirectional "lossless" conversion

### Fallback Behavior
- Unsupported markdown: rendered as plain paragraph
- Unsupported Notion blocks: rendered as `<!-- notion:block_type -->`

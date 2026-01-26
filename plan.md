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
  notionVersion?: string;  // defaults to latest supported version
}

// Explicit parent typing (matches Notion semantics)
type ParentRef = { pageId: string } | { databaseId: string };

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
  databaseId: string;
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
  
  // Database operations
  queryDatabase(request: DatabaseQueryRequest): Promise<Paginated<PageResponse>>;
  getDatabaseSchema(databaseId: string): Promise<DatabaseSchema>;
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

3. **Set up notion-roll-server package**
   - Create `packages/notion-roll-server/package.json`
   - Add esbuild and configuration
   - Reference notion-roll as workspace dependency
   - Create source directory structure

4. **Configure build and test scripts**
   - Root scripts for build-all, test-all
   - Package-specific scripts
   - Integration test script requiring `NOTION_API_KEY`

### Phase 2: Core Types & Primitives (Steps 5-7)

5. **Define core types and constraints**
   - Define `PageResponse`, `ParentRef`, `NotionRollError`
   - Define supported property types (write vs read-only)
   - Define supported markdown/block features
   - Export pass-through types for `NotionFilter`/`NotionSort`

6. **Implement Notion API client wrapper**
   - HTTP request wrapper using native fetch
   - Include `Authorization`, `Notion-Version` headers
   - Error handling with typed `NotionRollError`
   - Rate limit handling (429 retry with backoff)

7. **Implement low-level Notion primitives**
   - `getPageMeta(pageId)` - page metadata only
   - `listBlockChildren(blockId, cursor?)` - paginated + recursive helper
   - `appendBlockChildren(blockId, children)` - add blocks
   - `deleteBlockChildren(blockId)` - clear blocks for replace mode
   - `updatePageProperties(pageId, properties)` - property updates

### Phase 3: Converters (Steps 8-10)

8. **Implement markdown-to-blocks converter**
   - Parse markdown using marked/remark
   - Map to Notion block types (defined subset)
   - Handle inline formatting (bold, italic, links, code)
   - Handle code blocks with language
   - Unsupported: fallback to paragraph with raw text

9. **Implement blocks-to-markdown converter**
   - Traverse Notion block tree (using listBlockChildren)
   - Generate markdown from each block type
   - Handle nested blocks (lists)
   - Unsupported blocks: render as HTML comment

10. **Implement property converters**
    - `getDatabaseSchema` with in-memory caching
    - Convert input values based on schema (write-supported types)
    - Read-only types: return raw Notion format
    - Reverse conversion for responses

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
- `marked` or `remark` - Markdown parsing
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

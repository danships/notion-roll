# Notion Roll

A monorepo containing tools for simplified Notion API interactions with markdown support.

## Packages

| Package | Description |
|---------|-------------|
| [notion-roll](./packages/notion-roll) | Node library for Notion API with markdown ↔ blocks conversion |
| [notion-roll-server](./packages/notion-roll-server) | HTTP server exposing the library as REST endpoints |

## Quick Start

### Installation

```bash
npm install notion-roll
# or
pnpm add notion-roll
```

### Basic Usage

```typescript
import { NotionRoll } from 'notion-roll';

const client = new NotionRoll({ apiKey: 'secret_xxx' });

// Create a page with markdown content
const page = await client.createPage({
  parent: { pageId: 'parent-page-id' },
  title: 'My Page',
  content: '# Hello World\n\nThis is **markdown** content.',
});

// Get a page (returns markdown)
const fetched = await client.getPage(page.id);
console.log(fetched.content); // # Hello World\n\nThis is **markdown** content.

// Update page content
await client.updatePage({
  pageId: page.id,
  content: '# Updated Content',
  contentMode: 'replace', // or 'append'
});

// Archive a page
await client.archivePage(page.id);
```

## API Reference

### NotionRoll Class

```typescript
const client = new NotionRoll({
  apiKey: string;           // Notion API key (required)
  baseUrl?: string;         // Default: 'https://api.notion.com/v1'
  notionVersion?: string;   // Default: '2025-09-03'
});
```

#### Page Operations

| Method | Description |
|--------|-------------|
| `createPage(request)` | Create a new page with optional markdown content |
| `getPage(pageId, options?)` | Get page with content converted to markdown |
| `updatePage(request)` | Update page title, content, or properties |
| `archivePage(pageId)` | Archive (soft-delete) a page |

#### Database Operations

| Method | Description |
|--------|-------------|
| `queryDataSource(request)` | Query a database with filters and sorting |
| `getDataSourceSchema(dataSourceId)` | Get database schema |
| `getDataSources(databaseId)` | List data sources for a database |

### Markdown Support

**Supported Markdown → Notion Blocks:**
- Headings (h1, h2, h3)
- Paragraphs with inline formatting (bold, italic, strikethrough, code)
- Links
- Bullet lists and numbered lists
- Code blocks with language syntax
- Blockquotes
- Horizontal rules
- Images (external URLs)

**Notion Blocks → Markdown:**
- All supported blocks convert back to markdown
- Unsupported blocks render as `<!-- notion:block_type -->`

### Property Conversion

| Input Type | Notion Property Types |
|------------|----------------------|
| `string` | title, rich_text, select, multi_select, url, email, phone, status |
| `number` | number |
| `boolean` | checkbox |
| `Date/ISO string` | date |

Read-only properties (people, files, relation, rollup, formula, etc.) are returned as raw Notion format.

## Server Usage

The server package exposes the library as REST endpoints:

```bash
# Run the server
NOTION_API_KEY=secret_xxx pnpm --filter notion-roll-server start
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pages` | Create a page |
| GET | `/api/pages/:id` | Get a page |
| PATCH | `/api/pages/:id` | Update a page |
| POST | `/api/pages/:id/archive` | Archive a page |
| POST | `/api/databases/:id/query` | Query a database |
| GET | `/api/databases/:id/schema` | Get database schema |
| GET | `/health` | Health check |

Authentication via `Authorization: Bearer <api-key>` header or `NOTION_API_KEY` env var.

### Example Request

```bash
curl -X POST http://localhost:3000/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer secret_xxx" \
  -d '{
    "parent": { "pageId": "abc123" },
    "title": "My Page",
    "content": "# Hello\n\nMarkdown content here."
  }'
```

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Setup

```bash
pnpm install
pnpm build
```

### Testing

```bash
# Unit tests
pnpm test

# Integration tests (requires Notion API key)
# Create a .env file with:
#   NOTION_API_KEY=secret_xxx
#   NOTION_TEST_PARENT_PAGE=<page-id-for-test-pages>
pnpm test:integration
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests |
| `pnpm test:integration` | Run integration tests |
| `pnpm typecheck` | Type check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all packages |
| `pnpm clean` | Clean build outputs |

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NOTION_API_KEY` | Notion integration API key | Yes |
| `NOTION_TEST_PARENT_PAGE` | Parent page ID for integration tests | For tests |
| `PORT` | Server port (default: 3000) | No |

## License

MIT

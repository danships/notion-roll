# notion-roll

> 🌯 *Why "notion-roll"? It's a **wrapper** around the Notion API — and a wrap is just a roll by another name.*

Node library for simplified Notion API interactions with markdown support.

## Installation

```bash
npm install notion-roll
```

```bash
pnpm add notion-roll
```

## Quick Start

```typescript
import { NotionRoll } from 'notion-roll';

const notion = new NotionRoll({
  apiKey: 'your-notion-api-key',
});

// Create a page with markdown content
const page = await notion.createPage({
  parent: { dataSourceId: 'your-data-source-id' },
  title: 'My Page',
  content: '# Hello World\n\nThis is **bold** and *italic* text.',
  properties: {
    Status: 'In Progress',
    Priority: 3,
  },
});

// Read a page
const retrieved = await notion.getPage(page.id);
console.log(retrieved.content); // Markdown content
```

## API Reference

### `NotionRoll`

#### Constructor

```typescript
const notion = new NotionRoll(config: NotionRollConfig);
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your Notion API key |
| `baseUrl` | `string` | No | Custom API base URL |
| `notionVersion` | `string` | No | Notion API version |

#### `createPage(request: PageCreateRequest): Promise<PageResponse>`

Creates a new page.

```typescript
interface PageCreateRequest {
  parent: { pageId: string } | { dataSourceId: string };
  title: string;
  content?: string;  // Markdown content
  properties?: Record<string, unknown>;
}
```

#### `getPage(pageId: string, options?): Promise<PageResponse>`

Retrieves a page by ID.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeContent` | `boolean` | `true` | Whether to fetch page content |

#### `updatePage(request: PageUpdateRequest): Promise<PageResponse>`

Updates an existing page.

```typescript
interface PageUpdateRequest {
  pageId: string;
  title?: string;
  content?: string;  // Markdown content
  contentMode?: 'replace' | 'append';  // Default: 'replace'
  properties?: Record<string, unknown>;
}
```

#### `archivePage(pageId: string): Promise<PageResponse>`

Archives (soft-deletes) a page.

#### `queryDataSource(request: DatabaseQueryRequest): Promise<Paginated<PageResponse>>`

Queries pages from a data source.

```typescript
interface DatabaseQueryRequest {
  dataSourceId: string;
  filter?: NotionFilter;
  sorts?: NotionSort[];
  pageSize?: number;
  startCursor?: string;
}

interface NotionSort {
  property?: string;
  timestamp?: 'created_time' | 'last_edited_time';
  direction: 'ascending' | 'descending';
}
```

#### `getDataSourceSchema(dataSourceId: string): Promise<DatabaseSchema>`

Retrieves the schema for a data source.

```typescript
interface DatabaseSchema {
  id: string;
  title: string;
  properties: Record<string, PropertySchema>;
}
```

#### `getDataSources(databaseId: string): Promise<DataSourceInfo[]>`

Lists all data sources for a database.

```typescript
interface DataSourceInfo {
  id: string;
  type: 'default' | 'external';
}
```

### Response Types

```typescript
interface PageResponse {
  id: string;
  title: string;
  content: string;  // Markdown
  properties: Record<string, unknown>;
  createdTime: string;
  lastEditedTime: string;
}

interface Paginated<T> {
  results: T[];
  nextCursor?: string;
  hasMore: boolean;
}
```

## Supported Markdown Features

| Type | Features |
|------|----------|
| **Blocks** | `heading_1`, `heading_2`, `heading_3`, `paragraph`, `bulleted_list_item`, `numbered_list_item`, `code`, `quote`, `divider`, `image` |
| **Inline** | `bold`, `italic`, `strikethrough`, `code`, `link` |

## Property Types

### Writable Properties

These property types can be set using simple values:

| Type | Input Format | Example |
|------|--------------|---------|
| `title` | `string` | `"My Title"` |
| `rich_text` | `string` | `"Some text"` |
| `number` | `number` | `42` |
| `select` | `string` | `"Option A"` |
| `multi_select` | `string[]` | `["Tag1", "Tag2"]` |
| `status` | `string` | `"In Progress"` |
| `date` | `string` (ISO) or `{ start, end? }` | `"2024-01-15"` |
| `checkbox` | `boolean` | `true` |
| `url` | `string` | `"https://example.com"` |
| `email` | `string` | `"user@example.com"` |
| `phone_number` | `string` | `"+1234567890"` |

### Read-Only Properties

These property types are returned in raw Notion format:

| Type | Description |
|------|-------------|
| `people` | User references |
| `files` | File attachments |
| `relation` | Related pages |
| `rollup` | Computed rollup values |
| `formula` | Computed formula values |
| `created_time` | Page creation timestamp |
| `created_by` | Page creator |
| `last_edited_time` | Last edit timestamp |
| `last_edited_by` | Last editor |
| `unique_id` | Auto-generated unique ID |
| `verification` | Verification status |

## Error Handling

All API errors throw `NotionRollError`:

```typescript
import { NotionRoll, NotionRollError } from 'notion-roll';

try {
  await notion.getPage('invalid-id');
} catch (error) {
  if (error instanceof NotionRollError) {
    console.log(error.message);  // Error message
    console.log(error.status);   // HTTP status code
    console.log(error.code);     // Notion error code
    console.log(error.details);  // Additional details
  }
}
```

## License

MIT

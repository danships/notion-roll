# notion-roll-server

HTTP server exposing the notion-roll library as REST endpoints.

> **Note:** All responses are transformed by the notion-roll library, not raw Notion API responses. Content is automatically converted to/from markdown, and the response structure is simplified compared to the Notion API.

## Installation

```bash
pnpm install
pnpm build
```

## Running

```bash
# With environment variable
NOTION_API_KEY=your-api-key pnpm start

# Or with custom port
PORT=8080 NOTION_API_KEY=your-api-key pnpm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NOTION_API_KEY` | Notion API key (fallback if no Authorization header) | - |
| `PORT` | Server port | `3000` |

## Authentication

Provide your Notion API key via:

1. **Authorization header** (recommended): `Authorization: Bearer <your-api-key>`
2. **Environment variable**: Set `NOTION_API_KEY`

The Authorization header takes precedence over the environment variable.

## CORS

CORS is enabled for all origins with the following configuration:
- **Allowed Origins**: `*`
- **Allowed Methods**: `GET, POST, PATCH, DELETE, OPTIONS`
- **Allowed Headers**: `Content-Type, Authorization`

## Endpoints

### Health Check

#### `GET /health`

Returns server health status.

**Response:**
```json
{
  "status": "ok"
}
```

---

### Pages

#### `POST /api/pages`

Create a new page. Markdown content is automatically converted to Notion blocks.

**Request Body (page parent):**
```json
{
  "parent": { "pageId": "2f442602-d727-80ba-8eb9-c1159faed17c" },
  "title": "README Example Page",
  "content": "# Welcome\n\nThis is an **example** page with markdown content.\n\n- Item 1\n- Item 2\n- Item 3"
}
```

**Request Body (database/data source parent with properties):**
```json
{
  "parent": { "dataSourceId": "ds_abc123def456" },
  "title": "New Task",
  "content": "## Task Description\n\nThis is the task content in markdown.",
  "properties": {
    "Status": "To Do",
    "Priority": "High",
    "Due Date": "2026-02-15",
    "Completed": false,
    "Tags": ["feature", "urgent"]
  }
}
```

Property values are automatically converted to Notion format:
- `string` → title, rich_text, select, status, url, email, phone_number
- `number` → number
- `boolean` → checkbox
- `string` (ISO date) or `{ start, end? }` → date
- `string[]` → multi_select

**Response:** `201 Created`
```json
{
  "id": "2f642602-d727-8135-9624-d7ff22ea6d03",
  "title": "README Example Page",
  "content": "# Welcome\n\nThis is an **example** page with markdown content.\n\n- Item 1\n- Item 2\n- Item 3",
  "properties": {
    "title": {
      "id": "title",
      "type": "title",
      "title": [
        {
          "type": "text",
          "text": {
            "content": "README Example Page",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "README Example Page",
          "href": null
        }
      ]
    }
  },
  "createdTime": "2026-01-28T09:02:00.000Z",
  "lastEditedTime": "2026-01-28T09:02:00.000Z"
}
```

---

#### `GET /api/pages/:id`

Get a page by ID. The page content is automatically converted from Notion blocks to markdown.

**Response:** `200 OK`
```json
{
  "id": "2f642602-d727-8135-9624-d7ff22ea6d03",
  "title": "README Example Page",
  "content": "# Welcome\n\nThis is an **example** page with markdown content.\n\n- Item 1\n\n- Item 2\n\n- Item 3",
  "properties": {
    "title": {
      "id": "title",
      "type": "title",
      "title": [
        {
          "type": "text",
          "text": {
            "content": "README Example Page",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "README Example Page",
          "href": null
        }
      ]
    }
  },
  "createdTime": "2026-01-28T09:02:00.000Z",
  "lastEditedTime": "2026-01-28T09:02:00.000Z"
}
```

---

#### `PATCH /api/pages/:id`

Update a page.

**Request Body:**
```json
{
  "title": "Updated Example Page",
  "content": "# Updated Content\n\nThis content was updated.",
  "contentMode": "replace"
}
```

All fields are optional. `contentMode` can be `"replace"` (default) or `"append"`.

**Response:** `200 OK`
```json
{
  "id": "2f642602-d727-8135-9624-d7ff22ea6d03",
  "title": "Updated Example Page",
  "content": "# Updated Content\n\nThis content was updated.",
  "properties": {
    "title": {
      "id": "title",
      "type": "title",
      "title": [
        {
          "type": "text",
          "text": {
            "content": "Updated Example Page",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "Updated Example Page",
          "href": null
        }
      ]
    }
  },
  "createdTime": "2026-01-28T09:02:00.000Z",
  "lastEditedTime": "2026-01-28T09:02:00.000Z"
}
```

---

#### `POST /api/pages/:id/archive`

Archive a page.

**Response:** `200 OK`
```json
{
  "id": "2f642602-d727-8135-9624-d7ff22ea6d03",
  "title": "Updated Example Page",
  "content": "",
  "properties": {
    "title": {
      "id": "title",
      "type": "title",
      "title": [
        {
          "type": "text",
          "text": {
            "content": "Updated Example Page",
            "link": null
          },
          "annotations": {
            "bold": false,
            "italic": false,
            "strikethrough": false,
            "underline": false,
            "code": false,
            "color": "default"
          },
          "plain_text": "Updated Example Page",
          "href": null
        }
      ]
    }
  },
  "createdTime": "2026-01-28T09:02:00.000Z",
  "lastEditedTime": "2026-01-28T09:02:00.000Z"
}
```

---

### Databases

#### `POST /api/databases/:id/query`

Query a database.

**Request Body:**
```json
{
  "filter": {
    "property": "Status",
    "select": {
      "equals": "Done"
    }
  },
  "sorts": [
    {
      "property": "Name",
      "direction": "ascending"
    }
  ],
  "pageSize": 100,
  "startCursor": "optional-cursor"
}
```

All fields are optional. `sorts` can also use `timestamp` (`"created_time"` or `"last_edited_time"`) instead of `property`.

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "2f642602-d727-8135-9624-d7ff22ea6d03",
      "title": "Task 1",
      "content": "",
      "properties": {
        "Status": "Done",
        "Priority": "High"
      },
      "createdTime": "2026-01-28T09:02:00.000Z",
      "lastEditedTime": "2026-01-28T09:02:00.000Z"
    }
  ],
  "hasMore": false,
  "nextCursor": null
}
```

---

#### `GET /api/databases/:id/schema`

Get database schema.

**Response:** `200 OK`
```json
{
  "id": "2f442602-d727-80ba-8eb9-c1159faed17c",
  "title": "Tasks",
  "properties": {
    "Name": {
      "id": "title",
      "name": "Name",
      "type": "title"
    },
    "Status": {
      "id": "abc123",
      "name": "Status",
      "type": "select",
      "config": {
        "options": [
          { "id": "1", "name": "To Do", "color": "gray" },
          { "id": "2", "name": "In Progress", "color": "blue" },
          { "id": "3", "name": "Done", "color": "green" }
        ]
      }
    },
    "Priority": {
      "id": "def456",
      "name": "Priority",
      "type": "select",
      "config": {
        "options": [
          { "id": "1", "name": "Low", "color": "gray" },
          { "id": "2", "name": "Medium", "color": "yellow" },
          { "id": "3", "name": "High", "color": "red" }
        ]
      }
    }
  }
}
```

---

#### `GET /api/databases/:id/data-sources`

List data sources for a database.

**Response:** `200 OK`
```json
{
  "dataSources": [
    {
      "id": "ds_abc123",
      "type": "default"
    }
  ]
}
```

---

## Error Response Format

All errors return JSON with the following structure:

```json
{
  "error": "Error message",
  "code": "error_code",
  "details": {}
}
```

| Status | Description |
|--------|-------------|
| `400` | Bad request (invalid JSON, missing required fields) |
| `401` | Unauthorized (missing API key) |
| `404` | Not found |
| `405` | Method not allowed |
| `500` | Internal server error |

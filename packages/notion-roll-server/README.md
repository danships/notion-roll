# notion-roll-server

HTTP server exposing the notion-roll library as REST endpoints.

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

Create a new page.

**Request Body:**
```json
{
  "parent": { "database_id": "abc123" },
  "title": "My Page",
  "content": "Optional markdown content",
  "properties": {}
}
```

**Response:** `201 Created`
```json
{
  "id": "page-id",
  "title": "My Page",
  "url": "https://notion.so/..."
}
```

---

#### `GET /api/pages/:id`

Get a page by ID, including its content.

**Response:** `200 OK`
```json
{
  "id": "page-id",
  "title": "My Page",
  "content": "Page content...",
  "properties": {}
}
```

---

#### `PATCH /api/pages/:id`

Update a page.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "New content",
  "contentMode": "replace",
  "properties": {}
}
```

All fields are optional. `contentMode` can be `"replace"` (default) or `"append"`.

**Response:** `200 OK`
```json
{
  "id": "page-id",
  "title": "Updated Title"
}
```

---

#### `POST /api/pages/:id/archive`

Archive a page.

**Response:** `200 OK`
```json
{
  "id": "page-id",
  "archived": true
}
```

---

### Databases

#### `POST /api/databases/:id/query`

Query a database.

**Request Body:**
```json
{
  "filter": {},
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
  "results": [],
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
  "properties": {
    "Name": { "type": "title" },
    "Status": { "type": "select", "options": [] }
  }
}
```

---

#### `GET /api/databases/:id/data-sources`

List data sources for a database.

**Response:** `200 OK`
```json
{
  "dataSources": []
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

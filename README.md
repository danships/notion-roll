# Notion Roll

A monorepo containing tools for simplified Notion API interactions with markdown support.

## Packages

- **[notion-roll](./packages/notion-roll)** - Node library for Notion API with markdown ↔ blocks conversion
- **[notion-roll-server](./packages/notion-roll-server)** - HTTP server exposing the library as REST endpoints

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Setup

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Test

```bash
# Unit tests
pnpm test

# Integration tests (requires Notion API key)
NOTION_API_KEY=secret_xxx NOTION_TEST_PARENT_PAGE=abc123 pnpm test:integration
```

### Lint & Format

```bash
pnpm lint
pnpm format
```

## License

MIT

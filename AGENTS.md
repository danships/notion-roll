# Notion Roll - AI Agent Instructions

## Project Summary

Notion Roll is a TypeScript monorepo providing simplified Notion API interactions with automatic markdown conversion. It consists of two packages:

1. **notion-roll** - Core Node.js library that wraps the Notion API with:
   - Automatic markdown ↔ Notion blocks conversion
   - Simplified property value handling (converts JS primitives to Notion format)
   - Zod validation for all inputs
   - Support for Notion API version 2025-09-03 with data sources

2. **notion-roll-server** - HTTP REST server exposing the library as API endpoints

### Key Features
- Create/read/update/archive Notion pages with markdown content
- Query databases with filters and sorting
- Property conversion: strings, numbers, booleans, dates → Notion property format
- Input validation using Zod schemas based on Notion API specs

### Architecture
```
packages/
├── notion-roll/           # Core library
│   └── src/
│       ├── client.ts      # Main NotionRoll class
│       ├── validation.ts  # Zod schemas for input validation
│       ├── api/           # Low-level Notion API calls
│       ├── markdown/      # Markdown ↔ blocks conversion
│       └── properties/    # Property value conversion
└── notion-roll-server/    # HTTP server
    └── src/
        ├── server.ts      # Express-like HTTP server
        └── routes/        # API route handlers
```

## Commands to Run Before Committing

**Always run these commands from the repository root before committing:**

```bash
# Lint check
pnpm lint

# Type check
pnpm typecheck

# Run all unit tests
pnpm test
```

Or run all three in sequence:
```bash
pnpm lint && pnpm typecheck && pnpm test
```

## Other Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test:integration` | Run integration tests (requires `.env` with `NOTION_API_KEY`) |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check formatting without changes |
| `pnpm clean` | Remove build outputs |

## Code Conventions

- ESM modules (`"type": "module"`)
- File extensions in imports: `.js` (for ESM compatibility with TypeScript)
- Zod v4 for validation (use `import { z } from "zod/v4"`)
- Vitest for testing
- No comments unless code is complex
- Prefix unused variables with `_` to satisfy linter

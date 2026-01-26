#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${NOTION_API_KEY:-}" ]]; then
  echo "Error: NOTION_API_KEY environment variable is required"
  exit 1
fi

if [[ -z "${NOTION_TEST_PARENT_PAGE:-}" ]]; then
  echo "Error: NOTION_TEST_PARENT_PAGE environment variable is required"
  exit 1
fi

echo "Running integration tests..."
pnpm -r test:integration

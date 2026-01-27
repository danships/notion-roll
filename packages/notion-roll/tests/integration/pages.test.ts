import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestClient, getTestConfig } from "./setup.js";
import type { NotionRoll } from "../../src/index.js";

describe("Page operations", () => {
  let client: NotionRoll;
  let containerPageId: string;
  const createdPageIds: string[] = [];

  beforeAll(async () => {
    const { parentPageId } = getTestConfig();
    client = createTestClient();

    // Create a container page for all test pages
    const container = await client.createPage({
      parent: { pageId: parentPageId },
      title: `Test Container ${Date.now()}`,
      content: "Container for integration tests",
    });
    containerPageId = container.id;
  });

  afterAll(async () => {
    // Archive all created pages
    for (const pageId of createdPageIds) {
      try {
        await client.archivePage(pageId);
      } catch {
        // Ignore errors during cleanup
      }
    }

    // Archive the container page
    if (containerPageId) {
      try {
        await client.archivePage(containerPageId);
      } catch {
        // Ignore
      }
    }
  });

  it("creates a page with title only", async () => {
    const page = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Test Page - Title Only",
    });

    createdPageIds.push(page.id);

    expect(page.id).toBeDefined();
    expect(page.title).toBe("Test Page - Title Only");
    expect(page.createdTime).toBeDefined();
    expect(page.lastEditedTime).toBeDefined();
  });

  it("creates a page with markdown content", async () => {
    const content = `# Hello World

This is a **bold** and *italic* test.

- Item 1
- Item 2

\`\`\`javascript
console.log("Hello");
\`\`\`
`;

    const page = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Test Page - With Content",
      content,
    });

    createdPageIds.push(page.id);

    expect(page.id).toBeDefined();
    expect(page.title).toBe("Test Page - With Content");
  });

  it("gets a page with content", async () => {
    const content = "Simple paragraph content.";

    const created = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Test Page - Get",
      content,
    });
    createdPageIds.push(created.id);

    const fetched = await client.getPage(created.id, { includeContent: true });

    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe("Test Page - Get");
    expect(fetched.content).toContain("Simple paragraph content");
  });

  it("gets a page without content", async () => {
    const created = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Test Page - Get No Content",
      content: "This content should not be fetched.",
    });
    createdPageIds.push(created.id);

    const fetched = await client.getPage(created.id, { includeContent: false });

    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe("Test Page - Get No Content");
    expect(fetched.content).toBe("");
  });

  it("updates page title", async () => {
    const created = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Original Title",
    });
    createdPageIds.push(created.id);

    const updated = await client.updatePage({
      pageId: created.id,
      title: "Updated Title",
    });

    expect(updated.title).toBe("Updated Title");
  });

  it("updates page content in replace mode", async () => {
    const created = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Test Page - Update Replace",
      content: "Original content.",
    });
    createdPageIds.push(created.id);

    const updated = await client.updatePage({
      pageId: created.id,
      content: "Replaced content.",
      contentMode: "replace",
    });

    expect(updated.content).toContain("Replaced content");
    expect(updated.content).not.toContain("Original content");
  });

  it("updates page content in append mode", async () => {
    const created = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Test Page - Update Append",
      content: "Original content.",
    });
    createdPageIds.push(created.id);

    const updated = await client.updatePage({
      pageId: created.id,
      content: "Appended content.",
      contentMode: "append",
    });

    expect(updated.content).toContain("Original content");
    expect(updated.content).toContain("Appended content");
  });

  it("archives a page", async () => {
    const created = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Test Page - Archive",
    });

    const archived = await client.archivePage(created.id);

    expect(archived.id).toBe(created.id);
    // Page should no longer be retrievable after archive in some cases,
    // but the archive operation itself returns the page
  });

  it("handles complex markdown round-trip", async () => {
    const content = `# Main Heading

## Subheading

This has **bold**, *italic*, and \`code\`.

> A blockquote with some text.

---

1. First item
2. Second item

[Link text](https://example.com)
`;

    const created = await client.createPage({
      parent: { pageId: containerPageId },
      title: "Test Page - Complex Markdown",
      content,
    });
    createdPageIds.push(created.id);

    const fetched = await client.getPage(created.id, { includeContent: true });

    // Verify key elements are preserved
    expect(fetched.content).toContain("# Main Heading");
    expect(fetched.content).toContain("## Subheading");
    expect(fetched.content).toContain("**bold**");
    expect(fetched.content).toContain("*italic*");
    expect(fetched.content).toContain("`code`");
    expect(fetched.content).toContain(">");
    expect(fetched.content).toContain("---");
    expect(fetched.content).toContain("1.");
    // Notion normalizes URLs (may add trailing slash)
    expect(fetched.content).toMatch(/\[Link text\]\(https:\/\/example\.com\/?/);
  });
});

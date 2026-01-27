import { describe, it, expect } from "vitest";
import { markdownToNotionBlocks } from "../../src/markdown/to-blocks.js";
import { blocksToMarkdown } from "../../src/markdown/from-blocks.js";
import type { NotionBlock } from "../../src/api/types.js";

const createRichTextItem = (
  text: string,
  options: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    code?: boolean;
    href?: string | null;
  } = {}
) => ({
  type: "text",
  plain_text: text,
  annotations: {
    bold: options.bold ?? false,
    italic: options.italic ?? false,
    strikethrough: options.strikethrough ?? false,
    underline: false,
    code: options.code ?? false,
    color: "default",
  },
  href: options.href ?? null,
});

describe("markdownToNotionBlocks", () => {
  it("converts headings", () => {
    const blocks = markdownToNotionBlocks(
      "# Heading 1\n\n## Heading 2\n\n### Heading 3"
    );
    expect(blocks).toMatchSnapshot();
  });

  it("converts paragraphs with inline formatting", () => {
    const blocks = markdownToNotionBlocks(
      "This is **bold** and *italic* and ~~strikethrough~~ and `code`."
    );
    expect(blocks).toMatchSnapshot();
  });

  it("converts links", () => {
    const blocks = markdownToNotionBlocks(
      "Check out [this link](https://example.com) for more info."
    );
    expect(blocks).toMatchSnapshot();
  });

  it("converts bullet lists", () => {
    const blocks = markdownToNotionBlocks(
      "- First item\n- Second item\n- Third item"
    );
    expect(blocks).toMatchSnapshot();
  });

  it("converts numbered lists", () => {
    const blocks = markdownToNotionBlocks(
      "1. First item\n2. Second item\n3. Third item"
    );
    expect(blocks).toMatchSnapshot();
  });

  it("converts code blocks with language", () => {
    const blocks = markdownToNotionBlocks(
      '```typescript\nconst x = 42;\nconsole.log(x);\n```'
    );
    expect(blocks).toMatchSnapshot();
  });

  it("converts blockquotes", () => {
    const blocks = markdownToNotionBlocks("> This is a quote");
    expect(blocks).toMatchSnapshot();
  });

  it("converts horizontal rules", () => {
    const blocks = markdownToNotionBlocks("Before\n\n---\n\nAfter");
    expect(blocks).toMatchSnapshot();
  });

  it("converts images", () => {
    const blocks = markdownToNotionBlocks(
      "![Alt text](https://example.com/image.png)"
    );
    expect(blocks).toMatchSnapshot();
  });
});

describe("blocksToMarkdown", () => {
  it("converts headings", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "heading_1",
        heading_1: { rich_text: [createRichTextItem("Heading 1")] },
      },
      {
        object: "block",
        id: "2",
        type: "heading_2",
        heading_2: { rich_text: [createRichTextItem("Heading 2")] },
      },
      {
        object: "block",
        id: "3",
        type: "heading_3",
        heading_3: { rich_text: [createRichTextItem("Heading 3")] },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });

  it("converts paragraphs with inline formatting", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "paragraph",
        paragraph: {
          rich_text: [
            createRichTextItem("This is "),
            createRichTextItem("bold", { bold: true }),
            createRichTextItem(" and "),
            createRichTextItem("italic", { italic: true }),
            createRichTextItem(" and "),
            createRichTextItem("strikethrough", { strikethrough: true }),
            createRichTextItem(" and "),
            createRichTextItem("code", { code: true }),
            createRichTextItem("."),
          ],
        },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });

  it("converts links", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "paragraph",
        paragraph: {
          rich_text: [
            createRichTextItem("Check out "),
            createRichTextItem("this link", { href: "https://example.com" }),
            createRichTextItem(" for more info."),
          ],
        },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });

  it("converts bullet lists", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [createRichTextItem("First item")] },
      },
      {
        object: "block",
        id: "2",
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [createRichTextItem("Second item")] },
      },
      {
        object: "block",
        id: "3",
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [createRichTextItem("Third item")] },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });

  it("converts numbered lists", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "numbered_list_item",
        numbered_list_item: { rich_text: [createRichTextItem("First item")] },
      },
      {
        object: "block",
        id: "2",
        type: "numbered_list_item",
        numbered_list_item: { rich_text: [createRichTextItem("Second item")] },
      },
      {
        object: "block",
        id: "3",
        type: "numbered_list_item",
        numbered_list_item: { rich_text: [createRichTextItem("Third item")] },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });

  it("converts code blocks with language", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "code",
        code: {
          rich_text: [createRichTextItem("const x = 42;\nconsole.log(x);")],
          language: "typescript",
        },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });

  it("converts blockquotes", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "quote",
        quote: { rich_text: [createRichTextItem("This is a quote")] },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });

  it("converts horizontal rules", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "paragraph",
        paragraph: { rich_text: [createRichTextItem("Before")] },
      },
      {
        object: "block",
        id: "2",
        type: "divider",
        divider: {},
      },
      {
        object: "block",
        id: "3",
        type: "paragraph",
        paragraph: { rich_text: [createRichTextItem("After")] },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });

  it("converts images", () => {
    const blocks: NotionBlock[] = [
      {
        object: "block",
        id: "1",
        type: "image",
        image: {
          type: "external",
          external: { url: "https://example.com/image.png" },
          caption: [createRichTextItem("Alt text")],
        },
      },
    ];
    expect(blocksToMarkdown(blocks)).toMatchSnapshot();
  });
});

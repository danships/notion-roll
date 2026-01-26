import type { NotionBlock } from "../api/types.js";

export function blocksToMarkdown(blocks: NotionBlock[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const markdown = blockToMarkdown(block);
    if (markdown !== null) {
      lines.push(markdown);
    }
  }

  return lines.join("\n\n");
}

function blockToMarkdown(block: NotionBlock): string | null {
  const type = block.type;

  switch (type) {
    case "paragraph": {
      return richTextToMarkdown(getRichText(block, "paragraph"));
    }
    case "heading_1": {
      return `# ${richTextToMarkdown(getRichText(block, "heading_1"))}`;
    }
    case "heading_2": {
      return `## ${richTextToMarkdown(getRichText(block, "heading_2"))}`;
    }
    case "heading_3": {
      return `### ${richTextToMarkdown(getRichText(block, "heading_3"))}`;
    }
    case "bulleted_list_item": {
      const text = richTextToMarkdown(getRichText(block, "bulleted_list_item"));
      const children = getChildren(block);
      if (children.length > 0) {
        const childMarkdown = children
          .map((child) => {
            const md = blockToMarkdown(child);
            return md ? `  ${md}` : null;
          })
          .filter(Boolean)
          .join("\n");
        return `- ${text}\n${childMarkdown}`;
      }
      return `- ${text}`;
    }
    case "numbered_list_item": {
      const text = richTextToMarkdown(getRichText(block, "numbered_list_item"));
      const children = getChildren(block);
      if (children.length > 0) {
        const childMarkdown = children
          .map((child) => {
            const md = blockToMarkdown(child);
            return md ? `   ${md}` : null;
          })
          .filter(Boolean)
          .join("\n");
        return `1. ${text}\n${childMarkdown}`;
      }
      return `1. ${text}`;
    }
    case "to_do": {
      const toDoBlock = block["to_do"] as { rich_text: RichTextItem[]; checked: boolean };
      const checked = toDoBlock.checked ? "x" : " ";
      return `- [${checked}] ${richTextToMarkdown(toDoBlock.rich_text)}`;
    }
    case "toggle": {
      const text = richTextToMarkdown(getRichText(block, "toggle"));
      const children = getChildren(block);
      if (children.length > 0) {
        const childMarkdown = blocksToMarkdown(children);
        return `<details>\n<summary>${text}</summary>\n\n${childMarkdown}\n</details>`;
      }
      return `<details>\n<summary>${text}</summary>\n</details>`;
    }
    case "code": {
      const codeBlock = block["code"] as { rich_text: RichTextItem[]; language: string };
      const code = richTextToPlainText(codeBlock.rich_text);
      const language = codeBlock.language ?? "";
      return `\`\`\`${language}\n${code}\n\`\`\``;
    }
    case "quote": {
      const text = richTextToMarkdown(getRichText(block, "quote"));
      return text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    }
    case "divider": {
      return "---";
    }
    case "image": {
      const imageBlock = block["image"] as ImageBlock;
      const url = getImageUrl(imageBlock);
      const caption = imageBlock.caption
        ? richTextToPlainText(imageBlock.caption)
        : "";
      return `![${caption}](${url})`;
    }
    case "video": {
      const videoBlock = block["video"] as MediaBlock;
      const url = getMediaUrl(videoBlock);
      return `[Video](${url})`;
    }
    case "file": {
      const fileBlock = block["file"] as MediaBlock;
      const url = getMediaUrl(fileBlock);
      const caption = fileBlock.caption
        ? richTextToPlainText(fileBlock.caption)
        : "File";
      return `[${caption}](${url})`;
    }
    case "bookmark": {
      const bookmarkBlock = block["bookmark"] as { url: string; caption?: RichTextItem[] };
      const caption = bookmarkBlock.caption
        ? richTextToPlainText(bookmarkBlock.caption)
        : bookmarkBlock.url;
      return `[${caption}](${bookmarkBlock.url})`;
    }
    case "callout": {
      const calloutBlock = block["callout"] as { rich_text: RichTextItem[]; icon?: { emoji?: string } };
      const icon = calloutBlock.icon?.emoji ?? "💡";
      const text = richTextToMarkdown(calloutBlock.rich_text);
      return `> ${icon} ${text}`;
    }
    case "equation": {
      const equationBlock = block["equation"] as { expression: string };
      return `$$\n${equationBlock.expression}\n$$`;
    }
    case "table_of_contents": {
      return "<!-- Table of Contents -->";
    }
    case "child_page": {
      const childPageBlock = block["child_page"] as { title: string };
      return `[${childPageBlock.title}](${block.id})`;
    }
    case "child_database": {
      const childDbBlock = block["child_database"] as { title: string };
      return `[${childDbBlock.title}](${block.id})`;
    }
    case "embed": {
      const embedBlock = block["embed"] as { url: string };
      return `[Embed](${embedBlock.url})`;
    }
    case "link_preview": {
      const linkPreviewBlock = block["link_preview"] as { url: string };
      return `[${linkPreviewBlock.url}](${linkPreviewBlock.url})`;
    }
    case "synced_block": {
      // For synced blocks, we'd need to fetch the original - return comment
      return "<!-- Synced Block -->";
    }
    case "column_list":
    case "column": {
      // Columns are layout-only, process children
      const children = getChildren(block);
      if (children.length > 0) {
        return blocksToMarkdown(children);
      }
      return null;
    }
    default: {
      // Unsupported block type - render as HTML comment
      return `<!-- notion:${type} -->`;
    }
  }
}

interface RichTextItem {
  type: string;
  text?: { content: string; link?: { url: string } | null };
  plain_text: string;
  href?: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

interface ImageBlock {
  type: "external" | "file";
  external?: { url: string };
  file?: { url: string };
  caption?: RichTextItem[];
}

interface MediaBlock {
  type: "external" | "file";
  external?: { url: string };
  file?: { url: string };
  caption?: RichTextItem[];
}

function getRichText(block: NotionBlock, type: string): RichTextItem[] {
  const blockContent = block[type] as { rich_text?: RichTextItem[] } | undefined;
  return blockContent?.rich_text ?? [];
}

function getChildren(block: NotionBlock): NotionBlock[] {
  return (block["children"] as NotionBlock[] | undefined) ?? [];
}

function getImageUrl(image: ImageBlock): string {
  if (image.type === "external" && image.external?.url) {
    return image.external.url;
  }
  if (image.type === "file" && image.file?.url) {
    return image.file.url;
  }
  return "";
}

function getMediaUrl(media: MediaBlock): string {
  if (media.type === "external" && media.external?.url) {
    return media.external.url;
  }
  if (media.type === "file" && media.file?.url) {
    return media.file.url;
  }
  return "";
}

function richTextToMarkdown(richText: RichTextItem[]): string {
  return richText.map(richTextItemToMarkdown).join("");
}

function richTextToPlainText(richText: RichTextItem[]): string {
  return richText.map((item) => item.plain_text).join("");
}

function richTextItemToMarkdown(item: RichTextItem): string {
  let text = item.plain_text;

  // Apply annotations in correct order
  if (item.annotations.code) {
    text = `\`${text}\``;
  }
  if (item.annotations.strikethrough) {
    text = `~~${text}~~`;
  }
  if (item.annotations.italic) {
    text = `*${text}*`;
  }
  if (item.annotations.bold) {
    text = `**${text}**`;
  }

  // Handle links
  if (item.href) {
    text = `[${text}](${item.href})`;
  }

  return text;
}

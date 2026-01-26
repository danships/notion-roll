import { Lexer, type Token, type Tokens } from "marked";
import type { NotionBlock } from "../api/types.js";

type NotionRichText = {
  type: "text";
  text: { content: string; link?: { url: string } | null };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: "default";
  };
};

const DEFAULT_ANNOTATIONS: NotionRichText["annotations"] = {
  bold: false,
  italic: false,
  strikethrough: false,
  underline: false,
  code: false,
  color: "default",
};

export function markdownToBlocks(markdown: string): NotionBlock[] {
  const lexer = new Lexer();
  const tokens = lexer.lex(markdown);
  return tokensToBlocks(tokens);
}

function tokensToBlocks(tokens: Token[]): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  for (const token of tokens) {
    const block = tokenToBlock(token);
    if (block) {
      blocks.push(block);
    }
  }

  return blocks;
}

function tokenToBlock(token: Token): NotionBlock | null {
  switch (token.type) {
    case "heading": {
      return createHeadingBlock(token as Tokens.Heading);
    }
    case "paragraph": {
      return createParagraphBlock(token as Tokens.Paragraph);
    }
    case "code": {
      return createCodeBlock(token as Tokens.Code);
    }
    case "blockquote": {
      return createQuoteBlock(token as Tokens.Blockquote);
    }
    case "list": {
      return null; // Lists are handled separately - items become individual blocks
    }
    case "list_item": {
      return null; // Handled by parent list
    }
    case "hr": {
      return createDividerBlock();
    }
    case "space": {
      return null;
    }
    default: {
      // Unsupported token - try to extract text and create paragraph
      if ("text" in token && typeof token.text === "string") {
        return {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [createRichText(token.text)],
          },
        };
      }
      return null;
    }
  }
}

function createHeadingBlock(token: Tokens.Heading): NotionBlock {
  const depth = Math.min(token.depth, 3) as 1 | 2 | 3;
  const type = `heading_${depth}` as const;

  return {
    object: "block",
    type,
    [type]: {
      rich_text: inlineTokensToRichText(token.tokens),
    },
  };
}

function createParagraphBlock(token: Tokens.Paragraph): NotionBlock {
  // Check if this is an image
  if (
    token.tokens.length === 1 &&
    token.tokens[0]?.type === "image"
  ) {
    const imageToken = token.tokens[0] as Tokens.Image;
    return createImageBlock(imageToken);
  }

  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: inlineTokensToRichText(token.tokens),
    },
  };
}

function createImageBlock(token: Tokens.Image): NotionBlock {
  return {
    object: "block",
    type: "image",
    image: {
      type: "external",
      external: {
        url: token.href,
      },
    },
  };
}

function createCodeBlock(token: Tokens.Code): NotionBlock {
  const language = mapLanguage(token.lang ?? "plain text");

  return {
    object: "block",
    type: "code",
    code: {
      rich_text: [createRichText(token.text)],
      language,
    },
  };
}

function createQuoteBlock(token: Tokens.Blockquote): NotionBlock {
  // Extract text from blockquote tokens
  const richText: NotionRichText[] = [];

  for (const child of token.tokens) {
    if (child.type === "paragraph") {
      richText.push(...inlineTokensToRichText(child.tokens));
    } else if ("text" in child && typeof child.text === "string") {
      richText.push(createRichText(child.text));
    }
  }

  return {
    object: "block",
    type: "quote",
    quote: {
      rich_text: richText.length > 0 ? richText : [createRichText("")],
    },
  };
}

function createDividerBlock(): NotionBlock {
  return {
    object: "block",
    type: "divider",
    divider: {},
  };
}

export function createListItemBlocks(
  tokens: Token[]
): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  for (const token of tokens) {
    if (token.type === "list") {
      const listToken = token as Tokens.List;
      const itemType = listToken.ordered
        ? "numbered_list_item"
        : "bulleted_list_item";

      for (const item of listToken.items) {
        const richText: NotionRichText[] = [];

        for (const child of item.tokens) {
          if (child.type === "text") {
            richText.push(...inlineTokensToRichText((child as Tokens.Text).tokens ?? []));
            if ((child as Tokens.Text).tokens === undefined) {
              richText.push(createRichText((child as Tokens.Text).text));
            }
          } else if (child.type === "paragraph") {
            richText.push(...inlineTokensToRichText((child as Tokens.Paragraph).tokens));
          }
        }

        blocks.push({
          object: "block",
          type: itemType,
          [itemType]: {
            rich_text: richText.length > 0 ? richText : [createRichText("")],
          },
        });
      }
    } else {
      const block = tokenToBlock(token);
      if (block) {
        blocks.push(block);
      }
    }
  }

  return blocks;
}

function inlineTokensToRichText(tokens: Token[] | undefined): NotionRichText[] {
  if (!tokens || tokens.length === 0) {
    return [];
  }

  const richText: NotionRichText[] = [];

  for (const token of tokens) {
    richText.push(...inlineTokenToRichText(token));
  }

  return richText;
}

function inlineTokenToRichText(
  token: Token,
  parentAnnotations: Partial<NotionRichText["annotations"]> = {}
): NotionRichText[] {
  const annotations = { ...DEFAULT_ANNOTATIONS, ...parentAnnotations };

  switch (token.type) {
    case "text": {
      return [createRichText(token.text, annotations)];
    }
    case "strong": {
      const strongToken = token as Tokens.Strong;
      return inlineTokensToRichText(strongToken.tokens).map((rt) => ({
        ...rt,
        annotations: { ...rt.annotations, bold: true },
      }));
    }
    case "em": {
      const emToken = token as Tokens.Em;
      return inlineTokensToRichText(emToken.tokens).map((rt) => ({
        ...rt,
        annotations: { ...rt.annotations, italic: true },
      }));
    }
    case "del": {
      const delToken = token as Tokens.Del;
      return inlineTokensToRichText(delToken.tokens).map((rt) => ({
        ...rt,
        annotations: { ...rt.annotations, strikethrough: true },
      }));
    }
    case "codespan": {
      const codeToken = token as Tokens.Codespan;
      return [
        createRichText(codeToken.text, { ...annotations, code: true }),
      ];
    }
    case "link": {
      const linkToken = token as Tokens.Link;
      const text =
        linkToken.tokens.length > 0
          ? linkToken.tokens.map((t) => ("text" in t ? t.text : "")).join("")
          : linkToken.text;
      return [
        {
          type: "text",
          text: {
            content: text,
            link: { url: linkToken.href },
          },
          annotations,
        },
      ];
    }
    case "escape": {
      return [createRichText(token.text, annotations)];
    }
    default: {
      if ("text" in token && typeof token.text === "string") {
        return [createRichText(token.text, annotations)];
      }
      return [];
    }
  }
}

function createRichText(
  content: string,
  annotations: NotionRichText["annotations"] = DEFAULT_ANNOTATIONS
): NotionRichText {
  return {
    type: "text",
    text: { content, link: null },
    annotations,
  };
}

function mapLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    "": "plain text",
  };

  const normalized = lang.toLowerCase().trim();
  return languageMap[normalized] ?? normalized;
}

// Re-export with list handling
export function markdownToNotionBlocks(markdown: string): NotionBlock[] {
  const lexer = new Lexer();
  const tokens = lexer.lex(markdown);
  return createListItemBlocks(tokens);
}

import type { PropertySchema } from "../types.js";
import { WRITABLE_PROPERTY_TYPES } from "../types.js";

type WritableType = (typeof WRITABLE_PROPERTY_TYPES)[number];

export function fromNotionProperties(
  notionProperties: Record<string, unknown>,
  schema: Record<string, PropertySchema>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [name, notionValue] of Object.entries(notionProperties)) {
    const propertySchema = schema[name];
    if (!propertySchema) {
      result[name] = notionValue;
      continue;
    }

    result[name] = convertValueFromNotion(notionValue, propertySchema);
  }

  return result;
}

function convertValueFromNotion(
  notionValue: unknown,
  schema: PropertySchema
): unknown {
  const type = schema.type as WritableType;

  if (!WRITABLE_PROPERTY_TYPES.includes(type)) {
    return notionValue;
  }

  const value = notionValue as Record<string, unknown>;

  switch (type) {
    case "title": {
      return extractRichText(value["title"]);
    }
    case "rich_text": {
      return extractRichText(value["rich_text"]);
    }
    case "number": {
      return value["number"] ?? null;
    }
    case "select": {
      const select = value["select"] as { name: string } | null;
      return select?.name ?? null;
    }
    case "multi_select": {
      const multiSelect = value["multi_select"] as Array<{ name: string }> | null;
      return multiSelect?.map((item) => item.name) ?? [];
    }
    case "status": {
      const status = value["status"] as { name: string } | null;
      return status?.name ?? null;
    }
    case "date": {
      const date = value["date"] as { start: string; end?: string | null } | null;
      if (!date) return null;
      if (date.end) {
        return { start: date.start, end: date.end };
      }
      return date.start;
    }
    case "checkbox": {
      return Boolean(value["checkbox"]);
    }
    case "url": {
      return value["url"] ?? null;
    }
    case "email": {
      return value["email"] ?? null;
    }
    case "phone_number": {
      return value["phone_number"] ?? null;
    }
    default: {
      return notionValue;
    }
  }
}

interface RichTextItem {
  plain_text: string;
}

function extractRichText(richText: unknown): string {
  if (!Array.isArray(richText)) {
    return "";
  }
  return (richText as RichTextItem[]).map((item) => item.plain_text).join("");
}

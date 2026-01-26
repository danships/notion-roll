import type { PropertySchema } from "../types.js";
import { WRITABLE_PROPERTY_TYPES } from "../types.js";

type WritableType = (typeof WRITABLE_PROPERTY_TYPES)[number];

export function toNotionProperties(
  values: Record<string, unknown>,
  schema: Record<string, PropertySchema>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(values)) {
    const propertySchema = schema[name];
    if (!propertySchema) {
      continue;
    }

    const converted = convertValueToNotion(value, propertySchema);
    if (converted !== undefined) {
      result[name] = converted;
    }
  }

  return result;
}

function convertValueToNotion(
  value: unknown,
  schema: PropertySchema
): unknown {
  const type = schema.type as WritableType;

  if (!WRITABLE_PROPERTY_TYPES.includes(type)) {
    return undefined;
  }

  switch (type) {
    case "title": {
      return {
        title: createRichText(String(value ?? "")),
      };
    }
    case "rich_text": {
      return {
        rich_text: createRichText(String(value ?? "")),
      };
    }
    case "number": {
      const num = Number(value);
      return {
        number: Number.isNaN(num) ? null : num,
      };
    }
    case "select": {
      if (value === null || value === undefined || value === "") {
        return { select: null };
      }
      return {
        select: { name: String(value) },
      };
    }
    case "multi_select": {
      const items = Array.isArray(value) ? value : [value];
      return {
        multi_select: items
          .filter((item) => item !== null && item !== undefined && item !== "")
          .map((item) => ({ name: String(item) })),
      };
    }
    case "status": {
      if (value === null || value === undefined || value === "") {
        return { status: null };
      }
      return {
        status: { name: String(value) },
      };
    }
    case "date": {
      if (value === null || value === undefined || value === "") {
        return { date: null };
      }
      const dateValue = value as string | { start: string; end?: string };
      if (typeof dateValue === "string") {
        return {
          date: { start: dateValue },
        };
      }
      return {
        date: dateValue,
      };
    }
    case "checkbox": {
      return {
        checkbox: Boolean(value),
      };
    }
    case "url": {
      if (value === null || value === undefined || value === "") {
        return { url: null };
      }
      return {
        url: String(value),
      };
    }
    case "email": {
      if (value === null || value === undefined || value === "") {
        return { email: null };
      }
      return {
        email: String(value),
      };
    }
    case "phone_number": {
      if (value === null || value === undefined || value === "") {
        return { phone_number: null };
      }
      return {
        phone_number: String(value),
      };
    }
    default: {
      return undefined;
    }
  }
}

function createRichText(content: string): Array<{
  type: "text";
  text: { content: string };
}> {
  return [
    {
      type: "text",
      text: { content },
    },
  ];
}

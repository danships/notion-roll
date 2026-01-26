import type { PropertySchema } from "../types.js";

export function fromNotionProperties(
  _notionProperties: Record<string, unknown>,
  _schema: Record<string, PropertySchema>
): Record<string, unknown> {
  throw new Error("Not implemented");
}

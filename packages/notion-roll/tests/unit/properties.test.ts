import { describe, it, expect } from "vitest";
import { toNotionProperties } from "../../src/properties/to-notion.js";
import { fromNotionProperties } from "../../src/properties/from-notion.js";
import type { PropertySchema } from "../../src/types.js";

const mockSchema: Record<string, PropertySchema> = {
  Title: { id: "title", name: "Title", type: "title" },
  Description: { id: "desc", name: "Description", type: "rich_text" },
  Count: { id: "count", name: "Count", type: "number" },
  Status: { id: "status", name: "Status", type: "select" },
  Tags: { id: "tags", name: "Tags", type: "multi_select" },
  Progress: { id: "progress", name: "Progress", type: "status" },
  DueDate: { id: "due", name: "DueDate", type: "date" },
  Active: { id: "active", name: "Active", type: "checkbox" },
  Website: { id: "url", name: "Website", type: "url" },
  Email: { id: "email", name: "Email", type: "email" },
  Phone: { id: "phone", name: "Phone", type: "phone_number" },
  CreatedTime: { id: "created", name: "CreatedTime", type: "created_time" },
  Formula: { id: "formula", name: "Formula", type: "formula" },
};

describe("toNotionProperties", () => {
  describe("title", () => {
    it("converts string to title format", () => {
      const result = toNotionProperties({ Title: "Hello World" }, mockSchema);
      expect(result).toMatchInlineSnapshot(`
        {
          "Title": {
            "title": [
              {
                "text": {
                  "content": "Hello World",
                },
                "type": "text",
              },
            ],
          },
        }
      `);
    });

    it("converts null to empty string", () => {
      const result = toNotionProperties({ Title: null }, mockSchema);
      expect(result.Title).toEqual({
        title: [{ type: "text", text: { content: "" } }],
      });
    });

    it("converts undefined to empty string", () => {
      const result = toNotionProperties({ Title: undefined }, mockSchema);
      expect(result.Title).toEqual({
        title: [{ type: "text", text: { content: "" } }],
      });
    });
  });

  describe("rich_text", () => {
    it("converts string to rich_text format", () => {
      const result = toNotionProperties(
        { Description: "Some text" },
        mockSchema
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "Description": {
            "rich_text": [
              {
                "text": {
                  "content": "Some text",
                },
                "type": "text",
              },
            ],
          },
        }
      `);
    });

    it("converts null to empty string", () => {
      const result = toNotionProperties({ Description: null }, mockSchema);
      expect(result.Description).toEqual({
        rich_text: [{ type: "text", text: { content: "" } }],
      });
    });
  });

  describe("number", () => {
    it("converts number value", () => {
      const result = toNotionProperties({ Count: 42 }, mockSchema);
      expect(result).toMatchInlineSnapshot(`
        {
          "Count": {
            "number": 42,
          },
        }
      `);
    });

    it("converts string number", () => {
      const result = toNotionProperties({ Count: "123" }, mockSchema);
      expect(result.Count).toEqual({ number: 123 });
    });

    it("converts NaN to null", () => {
      const result = toNotionProperties({ Count: "not a number" }, mockSchema);
      expect(result.Count).toEqual({ number: null });
    });

    it("converts zero", () => {
      const result = toNotionProperties({ Count: 0 }, mockSchema);
      expect(result.Count).toEqual({ number: 0 });
    });
  });

  describe("select", () => {
    it("converts string to select format", () => {
      const result = toNotionProperties({ Status: "Active" }, mockSchema);
      expect(result).toMatchInlineSnapshot(`
        {
          "Status": {
            "select": {
              "name": "Active",
            },
          },
        }
      `);
    });

    it("converts null to null select", () => {
      const result = toNotionProperties({ Status: null }, mockSchema);
      expect(result.Status).toEqual({ select: null });
    });

    it("converts undefined to null select", () => {
      const result = toNotionProperties({ Status: undefined }, mockSchema);
      expect(result.Status).toEqual({ select: null });
    });

    it("converts empty string to null select", () => {
      const result = toNotionProperties({ Status: "" }, mockSchema);
      expect(result.Status).toEqual({ select: null });
    });
  });

  describe("multi_select", () => {
    it("converts array to multi_select format", () => {
      const result = toNotionProperties(
        { Tags: ["tag1", "tag2"] },
        mockSchema
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "Tags": {
            "multi_select": [
              {
                "name": "tag1",
              },
              {
                "name": "tag2",
              },
            ],
          },
        }
      `);
    });

    it("converts single value to array", () => {
      const result = toNotionProperties({ Tags: "single" }, mockSchema);
      expect(result.Tags).toEqual({
        multi_select: [{ name: "single" }],
      });
    });

    it("filters out null/undefined/empty values", () => {
      const result = toNotionProperties(
        { Tags: ["valid", null, undefined, "", "also valid"] },
        mockSchema
      );
      expect(result.Tags).toEqual({
        multi_select: [{ name: "valid" }, { name: "also valid" }],
      });
    });
  });

  describe("status", () => {
    it("converts string to status format", () => {
      const result = toNotionProperties(
        { Progress: "In Progress" },
        mockSchema
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "Progress": {
            "status": {
              "name": "In Progress",
            },
          },
        }
      `);
    });

    it("converts null to null status", () => {
      const result = toNotionProperties({ Progress: null }, mockSchema);
      expect(result.Progress).toEqual({ status: null });
    });

    it("converts empty string to null status", () => {
      const result = toNotionProperties({ Progress: "" }, mockSchema);
      expect(result.Progress).toEqual({ status: null });
    });
  });

  describe("date", () => {
    it("converts string to date format", () => {
      const result = toNotionProperties({ DueDate: "2024-01-15" }, mockSchema);
      expect(result).toMatchInlineSnapshot(`
        {
          "DueDate": {
            "date": {
              "start": "2024-01-15",
            },
          },
        }
      `);
    });

    it("converts object with start and end", () => {
      const result = toNotionProperties(
        { DueDate: { start: "2024-01-15", end: "2024-01-20" } },
        mockSchema
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "DueDate": {
            "date": {
              "end": "2024-01-20",
              "start": "2024-01-15",
            },
          },
        }
      `);
    });

    it("converts null to null date", () => {
      const result = toNotionProperties({ DueDate: null }, mockSchema);
      expect(result.DueDate).toEqual({ date: null });
    });

    it("converts empty string to null date", () => {
      const result = toNotionProperties({ DueDate: "" }, mockSchema);
      expect(result.DueDate).toEqual({ date: null });
    });
  });

  describe("checkbox", () => {
    it("converts true", () => {
      const result = toNotionProperties({ Active: true }, mockSchema);
      expect(result).toMatchInlineSnapshot(`
        {
          "Active": {
            "checkbox": true,
          },
        }
      `);
    });

    it("converts false", () => {
      const result = toNotionProperties({ Active: false }, mockSchema);
      expect(result.Active).toEqual({ checkbox: false });
    });

    it("converts truthy values to true", () => {
      const result = toNotionProperties({ Active: 1 }, mockSchema);
      expect(result.Active).toEqual({ checkbox: true });
    });

    it("converts falsy values to false", () => {
      const result = toNotionProperties({ Active: 0 }, mockSchema);
      expect(result.Active).toEqual({ checkbox: false });
    });
  });

  describe("url", () => {
    it("converts string to url format", () => {
      const result = toNotionProperties(
        { Website: "https://example.com" },
        mockSchema
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "Website": {
            "url": "https://example.com",
          },
        }
      `);
    });

    it("converts null to null url", () => {
      const result = toNotionProperties({ Website: null }, mockSchema);
      expect(result.Website).toEqual({ url: null });
    });

    it("converts empty string to null url", () => {
      const result = toNotionProperties({ Website: "" }, mockSchema);
      expect(result.Website).toEqual({ url: null });
    });
  });

  describe("email", () => {
    it("converts string to email format", () => {
      const result = toNotionProperties(
        { Email: "test@example.com" },
        mockSchema
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "Email": {
            "email": "test@example.com",
          },
        }
      `);
    });

    it("converts null to null email", () => {
      const result = toNotionProperties({ Email: null }, mockSchema);
      expect(result.Email).toEqual({ email: null });
    });
  });

  describe("phone_number", () => {
    it("converts string to phone_number format", () => {
      const result = toNotionProperties(
        { Phone: "+1-555-123-4567" },
        mockSchema
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "Phone": {
            "phone_number": "+1-555-123-4567",
          },
        }
      `);
    });

    it("converts null to null phone_number", () => {
      const result = toNotionProperties({ Phone: null }, mockSchema);
      expect(result.Phone).toEqual({ phone_number: null });
    });
  });

  describe("read-only properties", () => {
    it("skips read-only properties", () => {
      const result = toNotionProperties(
        { CreatedTime: "2024-01-01", Formula: "=1+1" },
        mockSchema
      );
      expect(result).toEqual({});
    });
  });

  describe("unknown properties", () => {
    it("skips properties not in schema", () => {
      const result = toNotionProperties(
        { UnknownProp: "value", Title: "Hello" },
        mockSchema
      );
      expect(result).toEqual({
        Title: {
          title: [{ type: "text", text: { content: "Hello" } }],
        },
      });
    });
  });
});

describe("fromNotionProperties", () => {
  describe("title", () => {
    it("extracts plain text from title", () => {
      const notionProps = {
        Title: {
          title: [
            { plain_text: "Hello " },
            { plain_text: "World" },
          ],
        },
      };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Title).toBe("Hello World");
    });

    it("returns empty string for empty title", () => {
      const notionProps = { Title: { title: [] } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Title).toBe("");
    });
  });

  describe("rich_text", () => {
    it("extracts plain text from rich_text", () => {
      const notionProps = {
        Description: {
          rich_text: [
            { plain_text: "Some " },
            { plain_text: "text" },
          ],
        },
      };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Description).toBe("Some text");
    });

    it("returns empty string for empty rich_text", () => {
      const notionProps = { Description: { rich_text: [] } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Description).toBe("");
    });
  });

  describe("number", () => {
    it("extracts number value", () => {
      const notionProps = { Count: { number: 42 } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Count).toBe(42);
    });

    it("returns null for null number", () => {
      const notionProps = { Count: { number: null } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Count).toBeNull();
    });

    it("handles zero", () => {
      const notionProps = { Count: { number: 0 } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Count).toBe(0);
    });
  });

  describe("select", () => {
    it("extracts name from select", () => {
      const notionProps = { Status: { select: { name: "Active" } } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Status).toBe("Active");
    });

    it("returns null for null select", () => {
      const notionProps = { Status: { select: null } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Status).toBeNull();
    });
  });

  describe("multi_select", () => {
    it("extracts names from multi_select", () => {
      const notionProps = {
        Tags: {
          multi_select: [{ name: "tag1" }, { name: "tag2" }],
        },
      };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Tags).toEqual(["tag1", "tag2"]);
    });

    it("returns empty array for null multi_select", () => {
      const notionProps = { Tags: { multi_select: null } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Tags).toEqual([]);
    });

    it("returns empty array for empty multi_select", () => {
      const notionProps = { Tags: { multi_select: [] } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Tags).toEqual([]);
    });
  });

  describe("status", () => {
    it("extracts name from status", () => {
      const notionProps = { Progress: { status: { name: "In Progress" } } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Progress).toBe("In Progress");
    });

    it("returns null for null status", () => {
      const notionProps = { Progress: { status: null } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Progress).toBeNull();
    });
  });

  describe("date", () => {
    it("extracts start date as string when no end", () => {
      const notionProps = {
        DueDate: { date: { start: "2024-01-15", end: null } },
      };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.DueDate).toBe("2024-01-15");
    });

    it("extracts date range as object", () => {
      const notionProps = {
        DueDate: { date: { start: "2024-01-15", end: "2024-01-20" } },
      };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.DueDate).toEqual({
        start: "2024-01-15",
        end: "2024-01-20",
      });
    });

    it("returns null for null date", () => {
      const notionProps = { DueDate: { date: null } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.DueDate).toBeNull();
    });
  });

  describe("checkbox", () => {
    it("extracts true checkbox", () => {
      const notionProps = { Active: { checkbox: true } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Active).toBe(true);
    });

    it("extracts false checkbox", () => {
      const notionProps = { Active: { checkbox: false } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Active).toBe(false);
    });
  });

  describe("url", () => {
    it("extracts url value", () => {
      const notionProps = { Website: { url: "https://example.com" } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Website).toBe("https://example.com");
    });

    it("returns null for null url", () => {
      const notionProps = { Website: { url: null } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Website).toBeNull();
    });
  });

  describe("email", () => {
    it("extracts email value", () => {
      const notionProps = { Email: { email: "test@example.com" } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Email).toBe("test@example.com");
    });

    it("returns null for null email", () => {
      const notionProps = { Email: { email: null } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Email).toBeNull();
    });
  });

  describe("phone_number", () => {
    it("extracts phone_number value", () => {
      const notionProps = { Phone: { phone_number: "+1-555-123-4567" } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Phone).toBe("+1-555-123-4567");
    });

    it("returns null for null phone_number", () => {
      const notionProps = { Phone: { phone_number: null } };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.Phone).toBeNull();
    });
  });

  describe("read-only properties", () => {
    it("passes through read-only properties unchanged", () => {
      const notionProps = {
        CreatedTime: { created_time: "2024-01-01T00:00:00.000Z" },
        Formula: { formula: { type: "number", number: 42 } },
      };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.CreatedTime).toEqual({
        created_time: "2024-01-01T00:00:00.000Z",
      });
      expect(result.Formula).toEqual({
        formula: { type: "number", number: 42 },
      });
    });
  });

  describe("unknown properties", () => {
    it("passes through properties not in schema", () => {
      const notionProps = {
        UnknownProp: { some: "value" },
        Title: { title: [{ plain_text: "Hello" }] },
      };
      const result = fromNotionProperties(notionProps, mockSchema);
      expect(result.UnknownProp).toEqual({ some: "value" });
      expect(result.Title).toBe("Hello");
    });
  });

  describe("round-trip conversion", () => {
    it("round-trips basic values", () => {
      const original = {
        Title: "Test Title",
        Description: "Test Description",
        Count: 42,
        Status: "Active",
        Tags: ["tag1", "tag2"],
        Progress: "In Progress",
        DueDate: "2024-01-15",
        Active: true,
        Website: "https://example.com",
        Email: "test@example.com",
        Phone: "+1-555-123-4567",
      };

      const notionFormat = toNotionProperties(original, mockSchema);
      const notionWithPlainText = addPlainTextToRichText(notionFormat);
      const backToSimple = fromNotionProperties(notionWithPlainText, mockSchema);

      expect(backToSimple).toEqual(original);
    });

    it("round-trips date range", () => {
      const original = {
        DueDate: { start: "2024-01-15", end: "2024-01-20" },
      };

      const notionFormat = toNotionProperties(original, mockSchema);
      const backToSimple = fromNotionProperties(notionFormat, mockSchema);

      expect(backToSimple).toEqual(original);
    });

    it("round-trips null values", () => {
      const original = {
        Status: null,
        DueDate: null,
        Website: null,
        Email: null,
        Phone: null,
      };

      const notionFormat = toNotionProperties(original, mockSchema);
      const backToSimple = fromNotionProperties(notionFormat, mockSchema);

      expect(backToSimple.Status).toBeNull();
      expect(backToSimple.DueDate).toBeNull();
      expect(backToSimple.Website).toBeNull();
      expect(backToSimple.Email).toBeNull();
      expect(backToSimple.Phone).toBeNull();
    });
  });
});

function addPlainTextToRichText(
  notionProps: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(notionProps)) {
    const prop = value as Record<string, unknown>;
    if (prop.title && Array.isArray(prop.title)) {
      result[key] = {
        title: (prop.title as Array<{ text: { content: string } }>).map(
          (item) => ({
            ...item,
            plain_text: item.text.content,
          })
        ),
      };
    } else if (prop.rich_text && Array.isArray(prop.rich_text)) {
      result[key] = {
        rich_text: (prop.rich_text as Array<{ text: { content: string } }>).map(
          (item) => ({
            ...item,
            plain_text: item.text.content,
          })
        ),
      };
    } else {
      result[key] = value;
    }
  }
  return result;
}

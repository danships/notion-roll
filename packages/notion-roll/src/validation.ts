import { z } from "zod/v4";

// Property value schemas for PageCreateRequest/PageUpdateRequest properties
const RichTextValueSchema = z.string();

const NumberValueSchema = z.number().nullable();

const SelectValueSchema = z.string().nullable();

const MultiSelectValueSchema = z.array(z.string());

const _StatusValueSchema = z.string().nullable();

const DateValueSchema = z.union([
  z.string(), // ISO date string
  z.object({
    start: z.string(),
    end: z.string().optional(),
  }),
  z.null(),
]);

const CheckboxValueSchema = z.boolean();

const UrlValueSchema = z.string().nullable();

const EmailValueSchema = z.email().nullable();

const PhoneNumberValueSchema = z.string().nullable();

// Union of all writable property value types
const PropertyValueSchema = z.union([
  RichTextValueSchema,
  NumberValueSchema,
  SelectValueSchema,
  MultiSelectValueSchema,
  DateValueSchema,
  CheckboxValueSchema,
  UrlValueSchema,
  EmailValueSchema,
  PhoneNumberValueSchema,
  z.null(),
]);

// Filter condition schemas based on Notion API
const CheckboxFilterSchema = z.object({
  equals: z.boolean().optional(),
  does_not_equal: z.boolean().optional(),
});

const DateFilterSchema = z.object({
  after: z.string().optional(),
  before: z.string().optional(),
  equals: z.string().optional(),
  on_or_after: z.string().optional(),
  on_or_before: z.string().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
  past_week: z.object({}).optional(),
  past_month: z.object({}).optional(),
  past_year: z.object({}).optional(),
  next_week: z.object({}).optional(),
  next_month: z.object({}).optional(),
  next_year: z.object({}).optional(),
});

const FilesFilterSchema = z.object({
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const MultiSelectFilterSchema = z.object({
  contains: z.string().optional(),
  does_not_contain: z.string().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const NumberFilterSchema = z.object({
  equals: z.number().optional(),
  does_not_equal: z.number().optional(),
  greater_than: z.number().optional(),
  greater_than_or_equal_to: z.number().optional(),
  less_than: z.number().optional(),
  less_than_or_equal_to: z.number().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const PeopleFilterSchema = z.object({
  contains: z.string().optional(),
  does_not_contain: z.string().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const PhoneNumberFilterSchema = z.object({
  equals: z.string().optional(),
  does_not_equal: z.string().optional(),
  contains: z.string().optional(),
  does_not_contain: z.string().optional(),
  starts_with: z.string().optional(),
  ends_with: z.string().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const RelationFilterSchema = z.object({
  contains: z.string().optional(),
  does_not_contain: z.string().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const RichTextFilterSchema = z.object({
  contains: z.string().optional(),
  does_not_contain: z.string().optional(),
  equals: z.string().optional(),
  does_not_equal: z.string().optional(),
  starts_with: z.string().optional(),
  ends_with: z.string().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const SelectFilterSchema = z.object({
  equals: z.string().optional(),
  does_not_equal: z.string().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const StatusFilterSchema = z.object({
  equals: z.string().optional(),
  does_not_equal: z.string().optional(),
  is_empty: z.literal(true).optional(),
  is_not_empty: z.literal(true).optional(),
});

const UniqueIdFilterSchema = z.object({
  equals: z.number().optional(),
  does_not_equal: z.number().optional(),
  greater_than: z.number().optional(),
  greater_than_or_equal_to: z.number().optional(),
  less_than: z.number().optional(),
  less_than_or_equal_to: z.number().optional(),
});

const TimestampFilterSchema = z.object({
  timestamp: z.enum(["created_time", "last_edited_time"]),
  created_time: DateFilterSchema.optional(),
  last_edited_time: DateFilterSchema.optional(),
});

const FormulaFilterSchema = z.object({
  checkbox: CheckboxFilterSchema.optional(),
  date: DateFilterSchema.optional(),
  number: NumberFilterSchema.optional(),
  string: RichTextFilterSchema.optional(),
});

// Base filter for a single property
const PropertyFilterSchema = z
  .object({
    property: z.string(),
    checkbox: CheckboxFilterSchema.optional(),
    date: DateFilterSchema.optional(),
    files: FilesFilterSchema.optional(),
    formula: FormulaFilterSchema.optional(),
    multi_select: MultiSelectFilterSchema.optional(),
    number: NumberFilterSchema.optional(),
    people: PeopleFilterSchema.optional(),
    phone_number: PhoneNumberFilterSchema.optional(),
    relation: RelationFilterSchema.optional(),
    rich_text: RichTextFilterSchema.optional(),
    select: SelectFilterSchema.optional(),
    status: StatusFilterSchema.optional(),
    unique_id: UniqueIdFilterSchema.optional(),
  })
  .strict();

// Compound filter with and/or (supports nesting up to 2 levels)
type FilterType =
  | z.infer<typeof PropertyFilterSchema>
  | z.infer<typeof TimestampFilterSchema>
  | { and: FilterType[] }
  | { or: FilterType[] };

const SimpleFilterSchema = z.union([PropertyFilterSchema, TimestampFilterSchema]);

const CompoundFilterSchema: z.ZodType<FilterType> = z.union([
  SimpleFilterSchema,
  z.object({
    and: z.array(z.lazy(() => CompoundFilterSchema)),
  }),
  z.object({
    or: z.array(z.lazy(() => CompoundFilterSchema)),
  }),
]);

// Export filter schema
export const NotionFilterSchema = CompoundFilterSchema;

// Sort schema
export const NotionSortSchema = z.object({
  property: z.string().optional(),
  timestamp: z.enum(["created_time", "last_edited_time"]).optional(),
  direction: z.enum(["ascending", "descending"]),
});

// Main config and request schemas
export const NotionRollConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.url().optional(),
  notionVersion: z.string().optional(),
});

const PageParentSchema = z.union([
  z.object({ pageId: z.string().min(1, "Page ID is required") }),
  z.object({ dataSourceId: z.string().min(1, "Data source ID is required") }),
]);

export const PageCreateRequestSchema = z.object({
  parent: PageParentSchema,
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  properties: z.record(z.string(), PropertyValueSchema).optional(),
});

export const PageUpdateRequestSchema = z.object({
  pageId: z.string().min(1, "Page ID is required"),
  title: z.string().optional(),
  content: z.string().optional(),
  contentMode: z.enum(["replace", "append"]).optional(),
  properties: z.record(z.string(), PropertyValueSchema).optional(),
});

export const DatabaseQueryRequestSchema = z.object({
  dataSourceId: z.string().min(1, "Data source ID is required"),
  filter: NotionFilterSchema.optional(),
  sorts: z.array(NotionSortSchema).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  startCursor: z.string().optional(),
});

export function validateConfig(config: unknown) {
  return NotionRollConfigSchema.parse(config);
}

export function validatePageCreateRequest(request: unknown) {
  return PageCreateRequestSchema.parse(request);
}

export function validatePageUpdateRequest(request: unknown) {
  return PageUpdateRequestSchema.parse(request);
}

export function validateDatabaseQueryRequest(request: unknown) {
  return DatabaseQueryRequestSchema.parse(request);
}

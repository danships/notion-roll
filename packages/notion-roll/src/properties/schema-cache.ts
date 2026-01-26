import type { ApiClient } from "../api/client.js";
import { getDataSource } from "../api/databases.js";
import type { DatabaseSchema, PropertySchema, PropertyType } from "../types.js";
import type { NotionDataSource, NotionPropertyConfig } from "../api/types.js";

export class SchemaCache {
  private cache = new Map<string, DatabaseSchema>();
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async getSchema(dataSourceId: string): Promise<DatabaseSchema> {
    const cached = this.cache.get(dataSourceId);
    if (cached) {
      return cached;
    }

    const dataSource = await getDataSource(this.api, dataSourceId);
    const schema = convertToSchema(dataSource);

    this.cache.set(dataSourceId, schema);
    return schema;
  }

  clearCache(): void {
    this.cache.clear();
  }

  invalidate(dataSourceId: string): void {
    this.cache.delete(dataSourceId);
  }
}

function convertToSchema(dataSource: NotionDataSource): DatabaseSchema {
  const properties: Record<string, PropertySchema> = {};

  if (dataSource.properties) {
    for (const [name, config] of Object.entries(dataSource.properties)) {
      properties[name] = convertPropertyConfig(name, config);
    }
  }

  return {
    id: dataSource.id,
    title: "",
    properties,
  };
}

function convertPropertyConfig(
  name: string,
  config: NotionPropertyConfig
): PropertySchema {
  return {
    id: config.id,
    name,
    type: config.type as PropertyType,
    config: extractPropertyConfig(config),
  };
}

function extractPropertyConfig(config: NotionPropertyConfig): unknown {
  const { id: _id, name: _name, type, ...rest } = config;

  switch (type) {
    case "select": {
      return rest["select"];
    }
    case "multi_select": {
      return rest["multi_select"];
    }
    case "status": {
      return rest["status"];
    }
    case "number": {
      return rest["number"];
    }
    case "relation": {
      return rest["relation"];
    }
    case "rollup": {
      return rest["rollup"];
    }
    case "formula": {
      return rest["formula"];
    }
    default: {
      return undefined;
    }
  }
}

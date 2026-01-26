export interface NotionBlock {
  object: "block";
  id?: string;
  type: string;
  [key: string]: unknown;
}

export interface NotionPage {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  properties: Record<string, unknown>;
  parent: NotionParent;
}

export type NotionParent =
  | { type: "page_id"; page_id: string }
  | { type: "database_id"; database_id: string }
  | { type: "workspace"; workspace: true };

export interface NotionRichText {
  type: "text";
  text: {
    content: string;
    link?: { url: string } | null;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string | null;
}

export interface NotionApiError {
  object: "error";
  status: number;
  code: string;
  message: string;
}

export interface Relationship {
  from: {
    table: string;
    field: string;
  };
  to: {
    table: string;
    field: string;
  };
}

export interface FieldSchema {
  type: string;
}

export interface TableSchema {
  fields: {
    [key: string]: FieldSchema;
  };
  encrypted: boolean;
  primaryKey: string;
}

export interface DatabaseSchema {
  tables: {
    [key: string]: TableSchema;
  };
  relationships: Relationship[];
}

export interface AccessType {
  owner: boolean;
  read: boolean;
  write: boolean;
  encrypted: boolean;
}

export interface RegistrationParams {
  appName: string;
  appId: string;
  author: string;
  url: string;
  domain: string;
  port: string;
  messageTypes: {
    [key: string]: AccessType;
  };
}

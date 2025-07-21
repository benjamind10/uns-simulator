export interface SchemaNode {
  id: string;
  name: string;
  kind: 'group' | 'metric';
  parent: string | null;
  path: string;
  order: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  children?: SchemaNode[];
  isTemporary?: boolean;
}

export interface ISchema {
  id: string;
  name: string;
  description?: string;
  nodes: SchemaNode[];
  brokerIds: string[];
  users: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchemaInput {
  name: string;
  description?: string;
}

export interface UpdateSchemaInput {
  name?: string;
  description?: string;
}

export interface SchemaNodeInput {
  name: string;
  kind: 'group' | 'metric';
  parent?: string | null;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  order?: number;
  path?: string;
}

export interface ISchemaNode {
  id: string;
  name: string;
  kind: 'group' | 'metric';
  parent: string | null;
  path: string;
  order: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  children?: ISchemaNode[];
  isTemporary?: boolean;
}

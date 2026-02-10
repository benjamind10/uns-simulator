export interface IPayloadTemplate {
  quality?: string;
  timestampMode?: 'auto' | 'fixed';
  fixedTimestamp?: number;
  value?: string | number | boolean;
  valueMode?: 'static' | 'random' | 'increment';
  minValue?: number;
  maxValue?: number;
  step?: number;
  precision?: number;
  customFields?: Array<{
    key: string;
    value: string | number | boolean;
    type: 'string' | 'number' | 'boolean';
  }>;
}

export interface ISchema {
  id: string;
  name: string;
  description?: string;
  nodes: ISchemaNode[];
  brokerIds: string[];
  users: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchemaInput {
  name: string;
  description?: string;
  nodes?: SchemaNodeInput[]; // <-- Add nodes for creation
  brokerIds?: string[];
  users?: string[];
}

export interface UpdateSchemaInput {
  name?: string;
  description?: string;
  nodes?: SchemaNodeInput[]; // <-- Add nodes for update
  brokerIds?: string[];
  users?: string[];
}

export interface SchemaNodeInput {
  id?: string; // <-- Add id for mutation compatibility
  name: string;
  kind: 'group' | 'metric' | 'object';
  parent?: string | null;
  path?: string;
  order?: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'Boolean' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  objectData?: Record<string, unknown>;
  payloadTemplate?: IPayloadTemplate;
}

export interface ISchemaNode {
  id: string;
  name: string;
  kind: 'group' | 'metric' | 'object';
  parent: string | null;
  path: string;
  order: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'Boolean' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  objectData?: Record<string, unknown>;
  payloadTemplate?: IPayloadTemplate;
  children?: ISchemaNode[];
  isTemporary?: boolean;
}

export interface SchemaInput {
  name: string;
  description?: string;
  nodes?: SchemaNodeInput[];
  brokerIds?: string[];
  users?: string[];
}

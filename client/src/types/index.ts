export interface IBroker {
  id: string;
  name: string;
  url: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  createdAt?: string;
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
  isTemporary?: boolean;
}

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
  isTemporary?: boolean; // Optional, for UI use
}

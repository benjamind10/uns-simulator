export interface SchemaNode {
  id: string;
  name: string;
  kind: 'group' | 'metric';
  parent?: string | null;
  path: string;
  order?: number;
  dataType?: string;
  unit?: string;
  engineering?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SchemaNodeState {
  nodes: SchemaNode[];
  loading: boolean;
  error: string | null;
}

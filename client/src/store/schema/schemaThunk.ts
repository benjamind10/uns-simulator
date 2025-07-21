import { createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/schema';
import type { ISchemaNode, ISchema } from '../../types';

// Input types for mutations
type SchemaNodeInput = Omit<ISchemaNode, 'id'>;
type SchemaInput = {
  name: string;
  description?: string;
  nodes?: SchemaNodeInput[];
  brokerIds?: string[];
  users?: string[];
};

// Fetch all schemas
export const fetchSchemasAsync = createAsyncThunk<ISchema[]>(
  'schema/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const schemas = await api.fetchSchemas();
      return schemas.map((schema) => ({
        ...schema,
        id: String(schema.id),
      })) as ISchema[];
    } catch (err) {
      if (err instanceof Error) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue('Failed to fetch schemas');
    }
  }
);

export const createSchemaAsync = createAsyncThunk<ISchema, SchemaInput>(
  'schema/create',
  async (input, { rejectWithValue }) => {
    try {
      const normalizedInput = {
        ...input,
        nodes: input.nodes?.map((node) => ({
          ...node,
          parent: node.parent === undefined ? null : node.parent,
        })),
      };
      const schema = await api.createSchema(normalizedInput);
      return {
        ...schema,
        id: String(schema.id),
      } as ISchema;
    } catch (err) {
      if (err instanceof Error) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue('Failed to create schema');
    }
  }
);

// Update a schema
export const updateSchemaAsync = createAsyncThunk<
  ISchema,
  { id: string; input: SchemaInput }
>('schema/update', async ({ id, input }, { rejectWithValue }) => {
  try {
    const normalizedInput = {
      ...input,
      nodes: input.nodes?.map((node) => ({
        ...node,
        parent: node.parent === undefined ? null : node.parent,
      })),
    };
    const schema = await api.updateSchema(id, normalizedInput);
    return {
      ...schema,
      id: String(schema.id),
    } as ISchema;
  } catch (err) {
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue('Failed to update schema');
  }
});

// Delete a schema
export const deleteSchemaAsync = createAsyncThunk<string, string>(
  'schema/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteSchema(id);
      return id;
    } catch (err) {
      if (err instanceof Error) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue('Failed to delete schema');
    }
  }
);

// Save nodes to schema
export const saveNodesToSchemaAsync = createAsyncThunk<
  ISchema,
  { schemaId: string; nodes: SchemaNodeInput[] }
>('schema/saveNodes', async ({ schemaId, nodes }, { rejectWithValue }) => {
  try {
    const nodesWithNormalizedParent = nodes.map((node) => ({
      ...node,
      parent: node.parent === undefined ? null : node.parent,
    }));
    const schema = await api.saveNodesToSchema(
      schemaId,
      nodesWithNormalizedParent
    );
    return {
      ...schema,
      id: String(schema.id),
    } as ISchema;
  } catch (err) {
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue('Failed to save nodes');
  }
});

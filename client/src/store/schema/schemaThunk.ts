import { createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/schema';
import type { ISchemaNode, ISchema } from '../../types';
import { SCHEMA_ACTIONS, SCHEMA_ERRORS } from '../constants';

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
  SCHEMA_ACTIONS.FETCH_ALL,
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
      return rejectWithValue(SCHEMA_ERRORS.FETCH_ALL_FAILED);
    }
  }
);

export const createSchemaAsync = createAsyncThunk<ISchema, SchemaInput>(
  SCHEMA_ACTIONS.CREATE,
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
      return rejectWithValue(SCHEMA_ERRORS.CREATE_FAILED);
    }
  }
);

// Update a schema
export const updateSchemaAsync = createAsyncThunk<
  ISchema,
  { id: string; input: SchemaInput }
>(SCHEMA_ACTIONS.UPDATE, async ({ id, input }, { rejectWithValue }) => {
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
    return rejectWithValue(SCHEMA_ERRORS.UPDATE_FAILED);
  }
});

// Delete a schema
export const deleteSchemaAsync = createAsyncThunk<string, string>(
  SCHEMA_ACTIONS.DELETE,
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteSchema(id);
      return id;
    } catch (err) {
      if (err instanceof Error) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue(SCHEMA_ERRORS.DELETE_FAILED);
    }
  }
);

// Save nodes to schema
export const saveNodesToSchemaAsync = createAsyncThunk<
  ISchema,
  { schemaId: string; nodes: SchemaNodeInput[] }
>(
  SCHEMA_ACTIONS.SAVE_NODES,
  async ({ schemaId, nodes }, { rejectWithValue }) => {
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
  }
);

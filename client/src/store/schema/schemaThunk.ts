import { createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/schema';
import type { ISchemaNode } from '../../api/schema';

// Fetch all schemas
export const fetchSchemasAsync = createAsyncThunk(
  'schema/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await api.fetchSchemas();
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message || 'Failed to fetch schemas');
      }
      return rejectWithValue('Failed to fetch schemas');
    }
  }
);

// Create a schema
export const createSchemaAsync = createAsyncThunk(
  'schema/create',
  async (
    input: { name: string; description?: string; nodes?: ISchemaNode[] },
    { rejectWithValue }
  ) => {
    try {
      return await api.createSchema(input);
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message || 'Failed to create schema');
      }
      return rejectWithValue('Failed to create schema');
    }
  }
);

// Update a schema
export const updateSchemaAsync = createAsyncThunk(
  'schema/update',
  async (
    {
      id,
      input,
    }: {
      id: string;
      input: { name: string; description?: string; nodes?: ISchemaNode[] };
    },
    { rejectWithValue }
  ) => {
    try {
      return await api.updateSchema(id, input);
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message || 'Failed to update schema');
      }
      return rejectWithValue('Failed to update schema');
    }
  }
);

// Delete a schema
export const deleteSchemaAsync = createAsyncThunk(
  'schema/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteSchema(id);
      return id;
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message || 'Failed to delete schema');
      }
      return rejectWithValue('Failed to delete schema');
    }
  }
);

// Save multiple nodes to a schema
export const saveNodesToSchemaAsync = createAsyncThunk(
  'schema/saveNodes',
  async (
    { schemaId, nodes }: { schemaId: string; nodes: ISchemaNode[] },
    { rejectWithValue }
  ) => {
    try {
      return await api.saveNodesToSchema(schemaId, nodes);
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message || 'Failed to save nodes');
      }
      return rejectWithValue('Failed to save nodes');
    }
  }
);

// Add a single node to a schema
export const addNodeToSchemaAsync = createAsyncThunk(
  'schema/addNode',
  async (
    { schemaId, node }: { schemaId: string; node: ISchemaNode },
    { rejectWithValue }
  ) => {
    try {
      return await api.addNodeToSchema(schemaId, node);
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message || 'Failed to add node');
      }
      return rejectWithValue('Failed to add node');
    }
  }
);

// Delete a node from a schema
export const deleteNodeFromSchemaAsync = createAsyncThunk(
  'schema/deleteNode',
  async (
    { schemaId, nodeId }: { schemaId: string; nodeId: string },
    { rejectWithValue }
  ) => {
    try {
      return await api.deleteNodeFromSchema(schemaId, nodeId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message || 'Failed to delete node');
      }
      return rejectWithValue('Failed to delete node');
    }
  }
);

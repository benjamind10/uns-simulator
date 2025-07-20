import { createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/schemaNode';
import type { SchemaNode } from './schemaNodeTypes';
import { getErrorMessage } from '../../utils/errorUtils';

// Fetch all schema nodes
export const fetchSchemaNodesAsync = createAsyncThunk(
  'schemaNode/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await api.fetchSchemaNodes();
    } catch (err: unknown) {
      return rejectWithValue(
        getErrorMessage(err, 'Failed to fetch schema nodes')
      );
    }
  }
);

// Create a schema node
export const createSchemaNodeAsync = createAsyncThunk(
  'schemaNode/create',
  async (
    input: Omit<SchemaNode, 'id' | 'createdAt' | 'updatedAt'>,
    { rejectWithValue }
  ) => {
    try {
      return await api.createSchemaNode(input);
    } catch (err: unknown) {
      return rejectWithValue(
        getErrorMessage(err, 'Failed to create schema node')
      );
    }
  }
);

// Update a schema node
export const updateSchemaNodeAsync = createAsyncThunk(
  'schemaNode/update',
  async (
    { id, input }: { id: string; input: Partial<SchemaNode> },
    { rejectWithValue }
  ) => {
    try {
      return await api.updateSchemaNode(id, input);
    } catch (err: unknown) {
      return rejectWithValue(
        getErrorMessage(err, 'Failed to update schema node')
      );
    }
  }
);

// Delete a schema node
export const deleteSchemaNodeAsync = createAsyncThunk(
  'schemaNode/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      return await api.deleteSchemaNode(id);
    } catch (err: unknown) {
      return rejectWithValue(
        getErrorMessage(err, 'Failed to delete schema node')
      );
    }
  }
);

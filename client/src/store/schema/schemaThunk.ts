import { createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/schema';

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
    input: { name: string; description?: string },
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
    }: { id: string; input: { name: string; description?: string } },
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

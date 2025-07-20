import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
  fetchSchemasAsync,
  createSchemaAsync,
  updateSchemaAsync,
  deleteSchemaAsync,
  saveNodesToSchemaAsync,
} from './schemaThunk';

// Define node type
export interface SchemaNode {
  id: string;
  name: string;
  kind: 'group' | 'metric';
  parent?: string | null;
  path: string;
  order?: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
}

// Schema type now includes nodes
export interface Schema {
  id: string;
  name: string;
  description?: string;
  nodes: SchemaNode[];
}

export interface SchemaState {
  schemas: Schema[];
  loading: boolean;
  error: string | null;
}

const initialState: SchemaState = {
  schemas: [],
  loading: false,
  error: null,
};

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    clearSchemaError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchemasAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchemasAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.schemas = action.payload;
      })
      .addCase(fetchSchemasAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch schemas';
      })
      .addCase(createSchemaAsync.fulfilled, (state, action) => {
        state.schemas.push(action.payload);
      })
      .addCase(updateSchemaAsync.fulfilled, (state, action) => {
        const idx = state.schemas.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.schemas[idx] = action.payload;
      })
      .addCase(deleteSchemaAsync.fulfilled, (state, action) => {
        state.schemas = state.schemas.filter((s) => s.id !== action.payload);
      })
      .addCase(saveNodesToSchemaAsync.fulfilled, (state, action) => {
        const idx = state.schemas.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.schemas[idx] = action.payload;
      });
  },
});

export const { clearSchemaError } = schemaSlice.actions;

export const selectSchemas = (state: RootState) => state.schema.schemas;
export const selectSchemaLoading = (state: RootState) => state.schema.loading;
export const selectSchemaError = (state: RootState) => state.schema.error;

export const schemaReducer = schemaSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '../store';
import type { ISchema } from '../../types';

import {
  fetchSchemasAsync,
  createSchemaAsync,
  updateSchemaAsync,
  deleteSchemaAsync,
  saveNodesToSchemaAsync,
  fetchNodesAsync,
} from './schemaThunk';

export interface SchemaState {
  schemas: ISchema[];
  loading: boolean;
  error: string | null;
  selectedSchemaId: string | null;
}

const initialState: SchemaState = {
  schemas: [],
  loading: false,
  error: null,
  selectedSchemaId: null,
};

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    clearSchemaError: (state) => {
      state.error = null;
    },
    setSelectedSchemaId: (state, action) => {
      state.selectedSchemaId = action.payload;
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
      })
      .addCase(fetchNodesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNodesAsync.fulfilled, (state, action) => {
        const idx = state.schemas.findIndex((s) => s.id === action.meta.arg);
        if (idx !== -1) {
          state.schemas[idx].nodes = action.payload;
        }
        state.loading = false;
      })
      .addCase(fetchNodesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch nodes';
      });
  },
});

export const { clearSchemaError, setSelectedSchemaId } = schemaSlice.actions;

export const selectSchemas = (state: RootState) => state.schema.schemas;
export const selectSchemaLoading = (state: RootState) => state.schema.loading;
export const selectSchemaError = (state: RootState) => state.schema.error;
export const selectSelectedSchemaId = (state: RootState) =>
  state.schema.selectedSchemaId;

export const schemaReducer = schemaSlice.reducer;

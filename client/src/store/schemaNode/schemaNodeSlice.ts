import { createSlice } from '@reduxjs/toolkit';
import type { SchemaNodeState } from './schemaNodeTypes';
import {
  fetchSchemaNodesAsync,
  createSchemaNodeAsync,
  updateSchemaNodeAsync,
  deleteSchemaNodeAsync,
} from './schemaNodeThunk';
import type { RootState } from '../store';

const initialState: SchemaNodeState = {
  nodes: [],
  loading: false,
  error: null,
};

const schemaNodeSlice = createSlice({
  name: 'schemaNode',
  initialState,
  reducers: {
    clearSchemaNodeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchemaNodesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchemaNodesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.nodes = action.payload;
      })
      .addCase(fetchSchemaNodesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch schema nodes';
      })
      .addCase(createSchemaNodeAsync.fulfilled, (state, action) => {
        state.nodes.push(action.payload);
      })
      .addCase(updateSchemaNodeAsync.fulfilled, (state, action) => {
        const idx = state.nodes.findIndex((n) => n.id === action.payload.id);
        if (idx !== -1) state.nodes[idx] = action.payload;
      })
      .addCase(deleteSchemaNodeAsync.fulfilled, (state, action) => {
        state.nodes = state.nodes.filter((n) => n.id !== action.payload);
      });
  },
});

// Actions
export const { clearSchemaNodeError } = schemaNodeSlice.actions;

// Selectors
export const selectSchemaNodes = (state: RootState) => state.schemaNode.nodes;
export const selectSchemaNodeLoading = (state: RootState) =>
  state.schemaNode.loading;
export const selectSchemaNodeError = (state: RootState) =>
  state.schemaNode.error;

export const schemaNodeReducer = schemaNodeSlice.reducer;

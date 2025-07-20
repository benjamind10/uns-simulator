import { createSlice } from '@reduxjs/toolkit';

import { initialState } from './brokerTypes';
import {
  fetchBrokersAsync,
  deleteBrokerAsync,
  updateBrokerAsync,
  createBrokerAsync,
} from './brokerThunks';

import type { RootState } from '../store';

const brokersSlice = createSlice({
  name: 'brokers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch brokers cases
      .addCase(fetchBrokersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrokersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.brokers = action.payload;
      })
      .addCase(fetchBrokersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch brokers';
      })
      // Delete broker cases
      .addCase(deleteBrokerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBrokerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.brokers = state.brokers.filter(
          (broker) => broker.id !== action.payload
        );
      })
      .addCase(deleteBrokerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete broker';
      })
      // Update broker cases
      .addCase(updateBrokerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBrokerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.brokers = state.brokers.map((broker) =>
          broker.id === action.payload.id ? action.payload : broker
        );
      })
      .addCase(updateBrokerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update broker';
      })
      // Create broker cases
      .addCase(createBrokerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBrokerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.brokers.push(action.payload);
      })
      .addCase(createBrokerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create broker';
      });
  },
});

// Selectors
export const selectBrokers = (state: RootState) => state.brokers.brokers;
export const selectBrokersLoading = (state: RootState) => state.brokers.loading;
export const selectBrokersError = (state: RootState) => state.brokers.error;

export default brokersSlice.reducer;

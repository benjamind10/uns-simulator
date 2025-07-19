import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchBrokers, deleteBroker } from '../api/brokers';
import type { IBroker } from '../types';

interface BrokersState {
  brokers: IBroker[];
  loading: boolean;
  error: string | null;
}

const initialState: BrokersState = {
  brokers: [],
  loading: false,
  error: null,
};

export const fetchBrokersAsync = createAsyncThunk(
  'brokers/fetchBrokers',
  async () => {
    return await fetchBrokers();
  }
);

export const deleteBrokerAsync = createAsyncThunk(
  'brokers/deleteBroker',
  async (id: string) => {
    await deleteBroker(id);
    return id;
  }
);

const brokersSlice = createSlice({
  name: 'brokers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrokersAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBrokersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.brokers = action.payload;
      })
      .addCase(fetchBrokersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch brokers';
      })
      .addCase(deleteBrokerAsync.fulfilled, (state, action) => {
        state.brokers = state.brokers.filter((b) => b.id !== action.payload);
      });
  },
});

export default brokersSlice.reducer;

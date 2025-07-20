import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchBrokers,
  deleteBroker,
  updateBroker,
  createBroker,
} from '../api/brokers';
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

export const updateBrokerAsync = createAsyncThunk(
  'brokers/updateBroker',
  async ({ id, data }: { id: string; data: Partial<IBroker> }) => {
    const updatedBroker = await updateBroker(id, data);
    return updatedBroker;
  }
);

// Add new createBroker thunk
export const createBrokerAsync = createAsyncThunk(
  'brokers/createBroker',
  async (data: Omit<IBroker, 'id' | 'createdAt'>) => {
    const newBroker = await createBroker(data);
    return newBroker;
  }
);

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
        state.brokers = state.brokers.filter((b) => b.id !== action.payload);
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

export default brokersSlice.reducer;

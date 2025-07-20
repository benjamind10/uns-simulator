import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchBrokers,
  deleteBroker,
  updateBroker,
  createBroker,
} from '../../api/brokers';

import type { IBroker } from '../../types';

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

export const createBrokerAsync = createAsyncThunk(
  'brokers/createBroker',
  async (data: Omit<IBroker, 'id' | 'createdAt'>) => {
    const newBroker = await createBroker(data);
    return newBroker;
  }
);

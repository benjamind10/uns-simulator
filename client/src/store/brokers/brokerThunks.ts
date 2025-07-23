import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchBrokers,
  deleteBroker,
  updateBroker,
  createBroker,
} from '../../api/brokers';
import { BROKER_ACTIONS } from '../constants';
import type { IBroker } from '../../types';

export const fetchBrokersAsync = createAsyncThunk(
  BROKER_ACTIONS.FETCH_ALL,
  async () => {
    return await fetchBrokers();
  }
);

export const deleteBrokerAsync = createAsyncThunk(
  BROKER_ACTIONS.DELETE,
  async (id: string) => {
    await deleteBroker(id);
    return id;
  }
);

export const updateBrokerAsync = createAsyncThunk(
  BROKER_ACTIONS.UPDATE,
  async ({ id, data }: { id: string; data: Partial<IBroker> }) => {
    const updatedBroker = await updateBroker(id, data);
    return updatedBroker;
  }
);

export const createBrokerAsync = createAsyncThunk(
  BROKER_ACTIONS.CREATE,
  async (data: Omit<IBroker, 'id' | 'createdAt'>) => {
    const newBroker = await createBroker(data);
    return newBroker;
  }
);

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ISimulationProfile } from '../../types/simulationProfile';
import {
  fetchSimulationProfiles,
  fetchSimulationProfile,
  createSimulationProfile,
  updateSimulationProfile,
  deleteSimulationProfile,
  type CreateSimulationProfileInput,
  type UpdateSimulationProfileInput,
} from '../../api/simulationProfile';

// Fetch all simulation profiles
export const fetchSimulationProfilesAsync = createAsyncThunk<
  ISimulationProfile[]
>('simulationProfile/fetchAll', async () => {
  return await fetchSimulationProfiles();
});

// Fetch a single simulation profile
export const fetchSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  string
>('simulationProfile/fetchOne', async (id) => {
  return await fetchSimulationProfile(id);
});

// Create a new simulation profile
export const createSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  CreateSimulationProfileInput
>('simulationProfile/create', async (input) => {
  return await createSimulationProfile(input);
});

// Update a simulation profile
export const updateSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  { id: string; input: UpdateSimulationProfileInput }
>('simulationProfile/update', async ({ id, input }) => {
  return await updateSimulationProfile(id, input);
});

// Delete a simulation profile
export const deleteSimulationProfileAsync = createAsyncThunk<string, string>(
  'simulationProfile/delete',
  async (id) => {
    await deleteSimulationProfile(id);
    return id;
  }
);

import { createAsyncThunk } from '@reduxjs/toolkit';

import type {
  ISimulationProfile,
  NodeSettings,
} from '../../types/simulationProfile';
import {
  fetchSimulationProfiles,
  fetchSimulationProfile,
  createSimulationProfile,
  updateSimulationProfile,
  deleteSimulationProfile,
  upsertNodeSettings,
  deleteNodeSettings,
  startSimulation,
  stopSimulation,
  pauseSimulation,
  resumeSimulation,
  type CreateSimulationProfileInput,
  type UpdateSimulationProfileInput,
  type NodeSettingsInput,
} from '../../api/simulationProfile';
import { SIMULATION_PROFILE_ACTIONS } from '../constants';

// Fetch all simulation profiles
export const fetchSimulationProfilesAsync = createAsyncThunk<
  ISimulationProfile[]
>(SIMULATION_PROFILE_ACTIONS.FETCH_ALL, async () => {
  return await fetchSimulationProfiles();
});

// Fetch a single simulation profile
export const fetchSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  string
>(SIMULATION_PROFILE_ACTIONS.FETCH_ONE, async (id) => {
  return await fetchSimulationProfile(id);
});

// Create a new simulation profile
export const createSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  CreateSimulationProfileInput
>(SIMULATION_PROFILE_ACTIONS.CREATE, async (input) => {
  return await createSimulationProfile(input);
});

// Update a simulation profile
export const updateSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  { id: string; input: UpdateSimulationProfileInput }
>(SIMULATION_PROFILE_ACTIONS.UPDATE, async ({ id, input }) => {
  return await updateSimulationProfile(id, input);
});

// Delete a simulation profile
export const deleteSimulationProfileAsync = createAsyncThunk<string, string>(
  SIMULATION_PROFILE_ACTIONS.DELETE,
  async (id) => {
    await deleteSimulationProfile(id);
    return id;
  }
);

// Upsert node settings for a profile
export const upsertNodeSettingsAsync = createAsyncThunk<
  NodeSettings,
  { profileId: string; nodeId: string; settings: NodeSettingsInput }
>(
  SIMULATION_PROFILE_ACTIONS.UPSERT_NODE_SETTINGS,
  async ({ profileId, nodeId, settings }) => {
    const result = await upsertNodeSettings(profileId, nodeId, settings);
    return { nodeId, ...result };
  }
);

// Delete node settings for a profile
export const deleteNodeSettingsAsync = createAsyncThunk<
  string,
  { profileId: string; nodeId: string }
>(
  SIMULATION_PROFILE_ACTIONS.DELETE_NODE_SETTINGS,
  async ({ profileId, nodeId }) => {
    await deleteNodeSettings(profileId, nodeId);
    return nodeId;
  }
);

// Simulation Control Thunks
export const startSimulationAsync = createAsyncThunk<boolean, string>(
  SIMULATION_PROFILE_ACTIONS.START_SIMULATION,
  async (profileId) => {
    return await startSimulation(profileId);
  }
);

export const stopSimulationAsync = createAsyncThunk<boolean, string>(
  SIMULATION_PROFILE_ACTIONS.STOP_SIMULATION,
  async (profileId) => {
    return await stopSimulation(profileId);
  }
);

export const pauseSimulationAsync = createAsyncThunk<boolean, string>(
  SIMULATION_PROFILE_ACTIONS.PAUSE_SIMULATION,
  async (profileId) => {
    return await pauseSimulation(profileId);
  }
);

export const resumeSimulationAsync = createAsyncThunk<boolean, string>(
  SIMULATION_PROFILE_ACTIONS.RESUME_SIMULATION,
  async (profileId) => {
    return await resumeSimulation(profileId);
  }
);

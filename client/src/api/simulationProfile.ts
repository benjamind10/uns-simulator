import { GraphQLClient } from 'graphql-request';

import type { ISimulationProfile } from '../types/simulationProfile';

import {
  CREATE_SIMULATION_PROFILE,
  UPDATE_SIMULATION_PROFILE,
  DELETE_SIMULATION_PROFILE,
  UPSERT_NODE_SETTINGS,
  DELETE_NODE_SETTINGS,
} from './mutations/simulationProfile.mutation';
import {
  GET_SIMULATION_PROFILES,
  GET_SIMULATION_PROFILE,
} from './queries/simulationProfile.queries';

const endpoint = import.meta.env.VITE_API_URL;

if (!endpoint) {
  throw new Error('VITE_API_URL is not defined in environment variables');
}

const getClient = () => {
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found');
  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

type SimulationProfilesResponse = { simulationProfiles: ISimulationProfile[] };
type SimulationProfileResponse = { simulationProfile: ISimulationProfile };
type CreateSimulationProfileResponse = {
  createSimulationProfile: ISimulationProfile;
};
type UpdateSimulationProfileResponse = {
  updateSimulationProfile: ISimulationProfile;
};
type DeleteSimulationProfileResponse = { deleteSimulationProfile: boolean };

type UpsertNodeSettingsResponse = {
  upsertNodeSettings: {
    frequency?: number;
    failRate?: number;
    payload?: {
      quality?: string;
      value?: string | number;
      timestamp?: number;
    };
  };
};

type DeleteNodeSettingsResponse = { deleteNodeSettings: boolean };

export type CreateSimulationProfileInput = {
  name: string;
  description?: string;
  schemaId: string;
  brokerId?: string;
  globalSettings: {
    defaultUpdateFrequency: number;
    timeScale: number;
    publishRoot?: string;
    startDelay?: number;
    simulationLength?: number;
    defaultPayload?: {
      quality: string;
      value: string | number;
      timestamp: number;
    };
  };
  defaultScenario?: string;
  nodeSettings?: Record<string, NodeSettingsInput>; // <-- Add this line
};

export type UpdateSimulationProfileInput =
  Partial<CreateSimulationProfileInput>;

export type NodeSettingsInput = {
  frequency?: number;
  failRate?: number;
  payload?: {
    quality?: string;
    value?: string | number;
    timestamp?: number;
  };
};

// Fetch all simulation profiles
export async function fetchSimulationProfiles(): Promise<ISimulationProfile[]> {
  const client = getClient();
  const data: SimulationProfilesResponse = await client.request(
    GET_SIMULATION_PROFILES
  );
  return data.simulationProfiles;
}

// Fetch a single simulation profile by ID
export async function fetchSimulationProfile(
  id: string
): Promise<ISimulationProfile> {
  const client = getClient();
  const data: SimulationProfileResponse = await client.request(
    GET_SIMULATION_PROFILE,
    { id }
  );
  return data.simulationProfile;
}

// Create a new simulation profile
export async function createSimulationProfile(
  input: CreateSimulationProfileInput
): Promise<ISimulationProfile> {
  const client = getClient();
  const variables = { input };
  const data: CreateSimulationProfileResponse = await client.request(
    CREATE_SIMULATION_PROFILE,
    variables
  );
  return data.createSimulationProfile;
}

// Update a simulation profile
export async function updateSimulationProfile(
  id: string,
  input: UpdateSimulationProfileInput
): Promise<ISimulationProfile> {
  const client = getClient();
  const variables = { id, input };
  const data: UpdateSimulationProfileResponse = await client.request(
    UPDATE_SIMULATION_PROFILE,
    variables
  );
  return data.updateSimulationProfile;
}

// Delete a simulation profile
export async function deleteSimulationProfile(id: string): Promise<boolean> {
  const client = getClient();
  const variables = { id };
  const data: DeleteSimulationProfileResponse = await client.request(
    DELETE_SIMULATION_PROFILE,
    variables
  );
  return data.deleteSimulationProfile;
}

// Upsert node settings for a profile
export async function upsertNodeSettings(
  profileId: string,
  nodeId: string,
  settings: NodeSettingsInput
): Promise<UpsertNodeSettingsResponse['upsertNodeSettings']> {
  const client = getClient();
  const variables = { profileId, nodeId, settings };
  const data: UpsertNodeSettingsResponse = await client.request(
    UPSERT_NODE_SETTINGS,
    variables
  );
  return data.upsertNodeSettings;
}

// Delete node settings
export async function deleteNodeSettings(
  profileId: string,
  nodeId: string
): Promise<boolean> {
  const client = getClient();
  const variables = { profileId, nodeId };
  const data: DeleteNodeSettingsResponse = await client.request(
    DELETE_NODE_SETTINGS,
    variables
  );
  return data.deleteNodeSettings;
}

import { GraphQLClient } from 'graphql-request';
import {
  CREATE_SIMULATION_PROFILE,
  UPDATE_SIMULATION_PROFILE,
  DELETE_SIMULATION_PROFILE,
  GET_SIMULATION_PROFILE,
  GET_SIMULATION_PROFILES,
} from './mutations/simulationProfile.mutation';
import type { ISimulationProfile } from '../types/simulationProfile';

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
  };
  defaultScenario?: string;
};

export type UpdateSimulationProfileInput =
  Partial<CreateSimulationProfileInput>;

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

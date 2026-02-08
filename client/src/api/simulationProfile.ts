import { GraphQLClient } from 'graphql-request';

import type { ISimulationProfile } from '../types/simulationProfile';

import {
  CREATE_SIMULATION_PROFILE,
  UPDATE_SIMULATION_PROFILE,
  DELETE_SIMULATION_PROFILE,
  UPSERT_NODE_SETTINGS,
  DELETE_NODE_SETTINGS,
  CLEANUP_DEFAULT_NODE_SETTINGS,
  START_SIMULATION,
  STOP_SIMULATION,
  PAUSE_SIMULATION,
  RESUME_SIMULATION,
  TEST_PUBLISH_NODE,
} from './mutations/simulationProfile.mutation';
import {
  GET_SIMULATION_PROFILES,
  GET_SIMULATION_PROFILE,
  GET_SIMULATION_STATUS, // Add this import
} from './queries/simulationProfile.queries';

const apiPath = import.meta.env.VITE_API_URL || '/graphql';

// Construct full URL: if relative path, use window.location.origin
const getFullUrl = () => {
  return apiPath.startsWith('http') 
    ? apiPath 
    : `${window.location.origin}${apiPath}`;
};

const getClient = () => {
  const token = sessionStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found');
  return new GraphQLClient(getFullUrl(), {
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
    nodeId: string;
    frequency?: number;
    failRate?: number;
    payload?: {
      quality?: string;
      timestampMode?: string;
      fixedTimestamp?: number;
      value?: string | number | boolean;
      valueMode?: string;
      minValue?: number;
      maxValue?: number;
      step?: number;
      precision?: number;
      customFields?: Array<{
        key: string;
        value: string | number | boolean;
        type: string;
      }>;
    };
  };
};

type DeleteNodeSettingsResponse = { deleteNodeSettings: boolean };
type CleanupDefaultNodeSettingsResponse = { cleanupDefaultNodeSettings: number };

// Simulation Control Response Types
type StartSimulationResponse = { startSimulation: boolean };
type StopSimulationResponse = { stopSimulation: boolean };
type PauseSimulationResponse = { pauseSimulation: boolean };
type ResumeSimulationResponse = { resumeSimulation: boolean };
type TestPublishNodeResponse = {
  testPublishNode: {
    success: boolean;
    topic: string | null;
    payload: any;
    error: string | null;
  };
};

// Add Simulation Status Response Type
type SimulationStatusResponse = {
  simulationStatus: {
    state: string;
    isRunning: boolean;
    isPaused: boolean;
    startTime?: string;
    lastActivity?: string;
    nodeCount?: number;
    mqttConnected?: boolean;
    reconnectAttempts?: number;
    error?: string;
  };
};

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
      quality?: string;
      timestampMode?: string;
      fixedTimestamp?: number;
      value?: string | number | boolean;
      valueMode?: string;
      minValue?: number;
      maxValue?: number;
      step?: number;
      precision?: number;
      customFields?: Array<{
        key: string;
        value: string | number | boolean;
        type: string;
      }>;
    };
  };
  defaultScenario?: string;
  nodeSettings?: Record<string, NodeSettingsInput>;
};

export type UpdateSimulationProfileInput =
  Partial<CreateSimulationProfileInput>;

export type NodeSettingsInput = {
  frequency?: number;
  failRate?: number;
  payload?: {
    quality?: string;
    timestampMode?: string;
    fixedTimestamp?: number;
    value?: string | number | boolean;
    valueMode?: string;
    minValue?: number;
    maxValue?: number;
    step?: number;
    precision?: number;
    customFields?: Array<{
      key: string;
      value: string | number | boolean;
      type: string;
    }>;
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

// Get simulation status by profile ID
export async function getSimulationStatus(
  profileId: string
): Promise<SimulationStatusResponse['simulationStatus']> {
  const client = getClient();
  const variables = { profileId };
  const data: SimulationStatusResponse = await client.request(
    GET_SIMULATION_STATUS,
    variables
  );
  return data.simulationStatus;
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

// Cleanup node settings with default-only payloads
export async function cleanupDefaultNodeSettings(
  profileId: string
): Promise<number> {
  const client = getClient();
  const variables = { profileId };
  const data: CleanupDefaultNodeSettingsResponse = await client.request(
    CLEANUP_DEFAULT_NODE_SETTINGS,
    variables
  );
  return data.cleanupDefaultNodeSettings;
}

// Start a simulation
export async function startSimulation(profileId: string): Promise<boolean> {
  const client = getClient();
  const variables = { profileId };
  const data: StartSimulationResponse = await client.request(
    START_SIMULATION,
    variables
  );
  return data.startSimulation;
}

// Stop a simulation
export async function stopSimulation(profileId: string): Promise<boolean> {
  const client = getClient();
  const variables = { profileId };
  const data: StopSimulationResponse = await client.request(
    STOP_SIMULATION,
    variables
  );
  return data.stopSimulation;
}

// Pause a simulation
export async function pauseSimulation(profileId: string): Promise<boolean> {
  const client = getClient();
  const variables = { profileId };
  const data: PauseSimulationResponse = await client.request(
    PAUSE_SIMULATION,
    variables
  );
  return data.pauseSimulation;
}

// Resume a simulation
export async function resumeSimulation(profileId: string): Promise<boolean> {
  const client = getClient();
  const variables = { profileId };
  const data: ResumeSimulationResponse = await client.request(
    RESUME_SIMULATION,
    variables
  );
  return data.resumeSimulation;
}

// Test publish a single node
export async function testPublishNode(
  profileId: string,
  nodeId: string
): Promise<TestPublishNodeResponse['testPublishNode']> {
  const client = getClient();
  const variables = { profileId, nodeId };
  const data: TestPublishNodeResponse = await client.request(
    TEST_PUBLISH_NODE,
    variables
  );
  return data.testPublishNode;
}

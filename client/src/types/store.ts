import type { ISchema } from './schema';

import type { IBroker, ISimulationProfile, SimulationState } from '.';

export interface BrokersState {
  brokers: IBroker[];
  loading: boolean;
  error: string | null;
}

export interface SchemaState {
  schemas: ISchema[];
  loading: boolean;
  error: string | null;
}

export interface SimulationStatus {
  state: SimulationState;
  isRunning: boolean;
  isPaused: boolean;
  startTime?: string | number | Date;
  lastActivity?: string | number | Date;
  nodeCount?: number;
  mqttConnected?: boolean;
  reconnectAttempts?: number;
  error?: string;
}

export interface SimulationProfileState {
  profiles: Record<string, ISimulationProfile>;
  selectedProfileId: string | null;
  loading: boolean;
  error: string | null;
  // Simulation control state
  simulationStates: Record<string, SimulationState>; // profileId -> state
  simulationLoading: Record<string, boolean>; // profileId -> loading
  simulationErrors: Record<string, string | null>; // profileId -> error
  simulationStatus: Record<string, SimulationStatus>; // profileId -> status
}
